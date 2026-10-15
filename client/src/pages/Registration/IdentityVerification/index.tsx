
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

import DocumentUpload from "./DocumentUpload";
import FaceRecognation from "./FaceRecognation";
import { useUploadDocumentMutation } from "../../../mutations/uploadDocument";
import { useFaceRecognationMutation } from "../../../mutations/faceRecognation";

type VerificationStep = "document" | "selfie";

export type FaceDetectionWithExpressions =
  faceapi.WithFaceExpressions<
    faceapi.WithFaceLandmarks<
      { detection: faceapi.FaceDetection },
      faceapi.FaceLandmarks68
    >
  >;

const IdentityVerification = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const isDetectingRef = useRef(false);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const [detections, setDetections] = useState<
    FaceDetectionWithExpressions[]
  >([]);

  const [verificationStep, setVerificationStep] =
    useState<VerificationStep>("document");

  const { mutate: uploadDocument } = useUploadDocumentMutation();
  const { mutate: faceRecognationVerify } = useFaceRecognationMutation();

  const handleDocumentContinue = (file: File) => {
    uploadDocument(file);
    
    setVerificationStep("selfie");
  };

  const handleSelfieCaptured = (data: FormData) => {
    faceRecognationVerify(data, {
      onSuccess: (res) => {
        console.log(res);
      },
      onError: (err) => {
        console.log(err);        
      }
    })
  };

  useEffect(() => {
    let cancelled = false;

    const loadModels = async () => {
      try {
        const MODEL_URL = `${import.meta.env.BASE_URL}models`;

        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

        if (!cancelled) {
          setModelsLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load face-api.js models:", error);

        if (!cancelled) {
          setModelError(
            "Unable to load face detection models. Please try again later.",
          );
        }
      }
    };

    loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleVideoOnPlay = () => {
    if (!modelsLoaded || detectionIntervalRef.current !== null) {
      return;
    }

    detectionIntervalRef.current = window.setInterval(async () => {
      const video = videoRef.current;

      if (
        !video ||
        video.readyState < 2 ||
        isDetectingRef.current
      ) {
        return;
      }

      isDetectingRef.current = true;

      try {
        const results = await faceapi
          .detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions(),
          )
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
        <DocumentUpload onContinue={handleDocumentContinue} />
      )}

      {verificationStep === "selfie" && (
        <>
          {modelError ? (
            <p role="alert">{modelError}</p>
          ) : !modelsLoaded ? (
            <p>Loading face detection models...</p>
          ) : (
            <FaceRecognation
              videoRef={videoRef}
              handleVideoOnPlay={handleVideoOnPlay}
              detections={detections}
              handleSelfieCaptured={handleSelfieCaptured}
            />
          )}
        </>
      )}
    </>
  );
};

export default IdentityVerification;