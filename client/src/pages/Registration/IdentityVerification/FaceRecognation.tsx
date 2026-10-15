import { useEffect } from "react";
import * as faceapi from "face-api.js";
import type { FaceDetectionWithExpressions } from ".";
import { Box, Button, Stack, Typography } from "@mui/material";

interface FaceRecognitionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  handleVideoOnPlay: () => void;
  detections: FaceDetectionWithExpressions[];
  handleSelfieCaptured: (data: FormData) => void;
  isFaceRecognationPending: boolean;
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({
  videoRef,
  handleVideoOnPlay,
  detections,
  handleSelfieCaptured,
  isFaceRecognationPending,
}) => {
  useEffect(() => {
    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: {} })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error(err));
    };

    startVideo();
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      video.addEventListener("play", () => {
        const canvas = faceapi.createCanvasFromMedia(video);
        const displaySize = {
          width: video.width,
          height: video.height,
        };
        faceapi.matchDimensions(canvas, displaySize);

        const drawDetections = () => {
          const context = canvas.getContext("2d");
          context?.clearRect(0, 0, canvas.width, canvas.height);
          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize,
          );
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        };

        if (detections.length > 0) {
          drawDetections();
        }
      });
    }
  }, [detections, videoRef]);

  const captureImage = () => {
    const video = videoRef.current;

    if (video) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw detections and expressions on the canvas
      if (detections.length > 0) {
        const resizedDetections = faceapi.resizeResults(detections, {
          width: canvas.width,
          height: canvas.height,
        });
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      }

      const dataUrl = canvas.toDataURL("image/jpeg");

      const byteString = atob(dataUrl.split(",")[1]);
      const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });

      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      handleSelfieCaptured(formData);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Position your face inside the frame and capture a clear selfie to
          verify your identity.
        </Typography>
      </Box>
      <Box sx={{ p: 2 }} className="face-recognition-container">
        <video
          ref={videoRef}
          autoPlay
          muted
          onPlay={handleVideoOnPlay}
          width="720"
          height="560"
          className="video-stream"
        />
        <Button
          variant="contained"
          size="medium"
          onClick={captureImage}
          disabled={isFaceRecognationPending}
          sx={{ mt: 2, width: "50%" }}
        >
          {!isFaceRecognationPending ? "Capture Image" : "Processing..."}
        </Button>
      </Box>
    </Stack>
  );
};

export default FaceRecognition;
