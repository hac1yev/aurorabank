import React, { useEffect, useRef, useState } from "react";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { getApiError } from "../../../utils/apiError";
import { validateDocumentFile } from "../../../utils/documentValidation";
import {
  restartRegistration,
  saveReview,
} from "../../../utils/registrationSession";
import { useCountdown } from "../hooks/useCountdown";
import { describeOcrError } from "./ocrErrors";

interface DocumentUploadProps {
  onContinue: (file: File) => void;
  isUploadPending: boolean;
  /** Error from the last upload attempt (mutation error). */
  uploadError?: unknown;
  /** Called when a new file is chosen so the previous upload error is cleared. */
  onFileChange?: () => void;
  /** Moves the user back to personal details to correct mismatched fields. */
  onReviewPersonalDetails?: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onContinue,
  isUploadPending,
  uploadError,
  onFileChange,
  onReviewPersonalDetails,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const apiError = getApiError(uploadError);
  const isBlockingCode =
    apiError.code === "OCR_LOCKED" || apiError.code === "OCR_RATE_LIMITED";
  const remainingSeconds = useCountdown(
    isBlockingCode ? apiError.retryAfter : undefined,
    uploadError,
  );
  const isBlocked = isBlockingCode && remainingSeconds > 0;
  const isLocked = isUploadPending || isBlocked;

  const errorView = uploadError
    ? describeOcrError(apiError, remainingSeconds)
    : null;

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    // Copy the selection before clearing the input (clearing may empty the FileList).
    const selectedFiles = Array.from(input.files ?? []);
    // Reset so choosing the same file again still fires onChange.
    input.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    onFileChange?.();

    if (selectedFiles.length > 1) {
      setFileError("You can upload only one file at a time.");
      return;
    }

    const selectedFile = selectedFiles[0];
    const reason = validateDocumentFile(selectedFile);
    if (reason) {
      setFileError(reason);
      return;
    }

    setFileError(null);
    setFile(selectedFile);
  };

  const handleRemove = () => {
    setFile(null);
    setFileError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleContinue = () => {
    if (!file || isLocked) {
      return;
    }
    onContinue(file);
  };

  const openFilePicker = () => {
    if (isLocked) {
      return;
    }
    inputRef.current?.click();
  };

  return (
    <Stack spacing={3}>
      {" "}
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {" "}
          Upload the photo page of your passport to verify your identity.{" "}
        </Typography>{" "}
      </Box>{" "}
      {!file ? (
        <Box
          sx={{
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 2,
            p: 5,
            textAlign: "center",
            cursor: "pointer",
            transition: "border-color 0.2s",
            "&:hover": { borderColor: "primary.main" },
          }}
          onClick={openFilePicker}
        >
          {" "}
          <CloudUploadOutlinedIcon
            sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
          />{" "}
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {" "}
            Upload your passport{" "}
          </Typography>{" "}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {" "}
            JPG, JPEG or PNG, up to 10 MB{" "}
          </Typography>{" "}
          <Button
            variant="outlined"
            sx={{ mt: 3 }}
            startIcon={<CloudUploadOutlinedIcon />}
            disabled={isLocked}
            onClick={(event) => {
              event.stopPropagation();
              openFilePicker();
            }}
          >
            {" "}
            Choose file{" "}
          </Button>{" "}
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            onChange={handleFileChange}
          />{" "}
        </Box>
      ) : (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {" "}
          {previewUrl ? (
            <Box
              component="img"
              src={previewUrl}
              alt="Passport preview"
              sx={{
                display: "block",
                width: "100%",
                maxHeight: 300,
                objectFit: "contain",
                bgcolor: "grey.100",
              }}
            />
          ) : (
            <Box sx={{ p: 5, textAlign: "center", bgcolor: "grey.100" }}>
              {" "}
              <DescriptionOutlinedIcon sx={{ fontSize: 50 }} />{" "}
              <Typography sx={{ mt: 1 }}> {file.name} </Typography>{" "}
            </Box>
          )}{" "}
          <Stack
            direction="row"
            sx={{ p: 2, justifyContent: "space-between", alignItems: "center" }}
          >
            {" "}
            <Box sx={{ minWidth: 0 }}>
              {" "}
              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                {" "}
                {file.name}{" "}
              </Typography>{" "}
              <Typography variant="caption" color="text.secondary">
                {" "}
                {(file.size / 1024 / 1024).toFixed(2)} MB{" "}
              </Typography>{" "}
            </Box>{" "}
            <Button
              color="error"
              startIcon={<DeleteOutlineOutlinedIcon />}
              onClick={handleRemove}
              disabled={isLocked}
            >
              {" "}
              Remove{" "}
            </Button>{" "}
          </Stack>{" "}
        </Box>
      )}{" "}
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        {" "}
        <Typography color="success.main"> ✓ </Typography>{" "}
        <Typography variant="body2" color="text.secondary">
          {" "}
          Make sure the document is clear and all information is visible.{" "}
        </Typography>{" "}
      </Stack>{" "}
      {(fileError || errorView) && (
        <Alert
          severity="error"
          action={
            errorView?.kind === "mismatch" ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  saveReview(apiError.fields ?? []);
                  onReviewPersonalDetails?.();
                }}
              >
                Review personal details
              </Button>
            ) : errorView?.kind === "sessionExpired" ? (
              <Button
                color="inherit"
                size="small"
                onClick={() =>
                  restartRegistration({ keepPersonalDetails: true })
                }
              >
                Start again
              </Button>
            ) : undefined
          }
        >
          {fileError ?? (
            <>
              <strong>{errorView?.title}</strong>
              <br />
              {errorView?.message}
            </>
          )}
        </Alert>
      )}{" "}
      <Button
        fullWidth
        variant="contained"
        size="large"
        disabled={!file || isLocked}
        onClick={handleContinue}
      >
        {" "}
        {isUploadPending ? "Processing..." : "Continue"}
      </Button>{" "}
    </Stack>
  );
};
export default DocumentUpload;
