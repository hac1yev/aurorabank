import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

import DocumentUpload from "./DocumentUpload";
import FaceRecognation from "./FaceRecognation";
import { useUploadDocumentMutation } from "../../../mutations/uploadDocument";
import { useFaceRecognationMutation } from "../../../mutations/faceRecognation";
import type { ComponentStepProps } from "../types";
import { FaceVerificationResult } from "./VerificationSuccess";
import { getApiError } from "../../../utils/apiError";
import { restartRegistration } from "../../../utils/registrationSession";

type VerificationStep = "document" | "selfie";

export type FaceDetectionWithExpressions = faceapi.WithFaceExpressions<
  faceapi.WithFaceLandmarks<
    { detection: faceapi.FaceDetection },
    faceapi.FaceLandmarks68
  >
>;

const IdentityVerification: React.FC<ComponentStepProps> = ({
  handleNext,
  activeStep,
  goToStep,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const isDetectingRef = useRef(false);
  const modelsLoadedRef = useRef(false);

  const [detections, setDetections] = useState<FaceDetectionWithExpressions[]>(
    [],
  );
  const [verificationStep, setVerificationStep] =
    useState<VerificationStep>("document");
  const [isModelLoading, setIsModelLoading] = useState(false);

  const {
    mutate: uploadDocument,
    isPending: isUploadPending,
    error: uploadError,
    reset: resetUpload,
  } = useUploadDocumentMutation();

  const {
    mutate: faceRecognationVerify,
    isPending: isFaceRecognationPending,
    isError: isFaceRecognationError,
    isSuccess: isFaceRecognationSuccess,
    error: faceRecognationError,
    reset: resetFaceRecognation,
  } = useFaceRecognationMutation();

  const handleDocumentContinue = (file: File) => {
    uploadDocument(file, {
      onSuccess: (res) => {
        const publicId: unknown = res.data.public_id;

        // Only advance when the server confirmed the document (it returns public_id on success).
        if (typeof publicId !== "string" || publicId === "") {
          return;
        }

        const userInfo = sessionStorage.getItem("userInfo");
        const parsedUserInfo = userInfo ? JSON.parse(userInfo) : {};

        sessionStorage.setItem(
          "userInfo",
          JSON.stringify({
            ...parsedUserInfo,
            public_id: publicId,
          }),
        );

        setVerificationStep("selfie");
      },
    });
  };

  const faceError = getApiError(faceRecognationError);
  const isDocumentNotVerified =
    faceError.status === 400 && faceError.matched === undefined;
  const isSessionExpired = faceError.status === 404;

  const goBackToDocument = () => {
    resetFaceRecognation();
    resetUpload();
    setVerificationStep("document");
  };

  const faceFailureView = isDocumentNotVerified
    ? {
        errorTitle: "Passport not verified",
        errorMessage:
          "Your passport must be verified before the selfie check. Please upload your passport again.",
        actionLabel: "Upload passport",
        handleAction: goBackToDocument,
      }
    : isSessionExpired
      ? {
          errorTitle: "Session expired",
          errorMessage:
            "Your registration session has expired. Please start again.",
          actionLabel: "Start again",
          handleAction: () =>
            restartRegistration({ keepPersonalDetails: true }),
        }
      : faceError.matched === false
        ? undefined // genuine face mismatch: keep the default copy and retake action
        : {
            errorTitle: "Something went wrong",
            errorMessage:
              "We could not complete the face check. Please try again.",
            actionLabel: undefined,
            handleAction: undefined,
          };

  const handleSelfieCaptured = (data: FormData) => {
    faceRecognationVerify(data, {
      onSuccess: () => {
        stopCamera();
      },
    });
  };

  const handleContinue = () => {
    sessionStorage.setItem("activeStep", String(Number(activeStep) + 1));
    handleNext?.();
  };

  const handleRetake = () => {
    resetFaceRecognation();
    setDetections([]);
  };

  const stopCamera = () => {
    const video = videoRef.current;

    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream;

      stream.getTracks().forEach((track) => {
        track.stop();
      });

      video.srcObject = null;
    }
  };

  useEffect(() => {
    if (verificationStep !== "selfie") return;

    let cancelled = false;

    const loadModels = async () => {
      setIsModelLoading(true);

      try {
        const modelUrl = `${import.meta.env.BASE_URL}models`;

        await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
        await faceapi.nets.faceExpressionNet.loadFromUri(modelUrl);

        if (!cancelled) {
          modelsLoadedRef.current = true;
        }
      } catch (error) {
        console.error("Failed to load face-api.js models:", error);
      } finally {
        if (!cancelled) {
          setIsModelLoading(false);
        }
      }
    };

    loadModels();

    return () => {
      cancelled = true;
    };
  }, [verificationStep]);

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current !== null) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }

      stopCamera();
    };
  }, []);

  const handleVideoOnPlay = () => {
    if (!modelsLoadedRef.current || detectionIntervalRef.current !== null) {
      return;
    }

    detectionIntervalRef.current = window.setInterval(async () => {
      const video = videoRef.current;

      if (!video || video.readyState < 2 || isDetectingRef.current) {
        return;
      }

      isDetectingRef.current = true;

      try {
        const results = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        setDetections(results);
      } catch (error) {
        console.error("Face detection failed:", error);
      } finally {
        isDetectingRef.current = false;
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current !== null) {
        window.clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, []);

  return (
    <>
      {verificationStep === "document" && (
        <DocumentUpload
          onContinue={handleDocumentContinue}
          isUploadPending={isUploadPending}
          uploadError={uploadError}
          onFileChange={resetUpload}
          onReviewPersonalDetails={() => goToStep?.(0)}
        />
      )}

      {verificationStep === "selfie" &&
        (isModelLoading ? (
          <p>Loading face detection models...</p>
        ) : isFaceRecognationSuccess ? (
          <FaceVerificationResult
            isSuccess={isFaceRecognationSuccess}
            handleContinue={handleContinue}
          />
        ) : isFaceRecognationError ? (
          <FaceVerificationResult
            isError={isFaceRecognationError}
            handleRetake={handleRetake}
            {...faceFailureView}
          />
        ) : (
          <FaceRecognation
            videoRef={videoRef}
            handleVideoOnPlay={handleVideoOnPlay}
            detections={detections}
            handleSelfieCaptured={handleSelfieCaptured}
            isFaceRecognationPending={isFaceRecognationPending}
          />
        ))}
    </>
  );
};

export default IdentityVerification;
