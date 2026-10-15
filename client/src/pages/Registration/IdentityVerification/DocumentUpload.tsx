import React, { useEffect, useRef, useState } from "react";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { Box, Button, Stack, Typography } from "@mui/material";

interface DocumentUploadProps {
  onContinue: (file: File) => void;
  isUploadPending: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onContinue, isUploadPending }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      return;
    }
    setFile(selectedFile);
  };
  const handleRemove = () => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };
  const handleContinue = () => {
    if (!file) {
      return;
    }
    onContinue(file);
  };
  return (
    <Stack spacing={3}>
      {" "}
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {" "}
          Upload your passport or ID card to verify your identity.{" "}
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
          onClick={() => inputRef.current?.click()}
        >
          {" "}
          <CloudUploadOutlinedIcon
            sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
          />{" "}
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {" "}
            Upload your ID document{" "}
          </Typography>{" "}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {" "}
            PNG, JPG, WEBP or PDF{" "}
          </Typography>{" "}
          <Button
            variant="outlined"
            sx={{ mt: 3 }}
            startIcon={<CloudUploadOutlinedIcon />}
            onClick={(event) => {
              event.stopPropagation();
              inputRef.current?.click();
            }}
          >
            {" "}
            Choose file{" "}
          </Button>{" "}
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
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
          {file.type.startsWith("image/") && previewUrl ? (
            <Box
              component="img"
              src={previewUrl}
              alt="Identity document preview"
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
      <Button
        fullWidth
        variant="contained"
        size="large"
        disabled={!file || isUploadPending}
        onClick={handleContinue}
      >
        {" "}
        {isUploadPending ? "Loading..." : "Continue"}
      </Button>{" "}
    </Stack>
  );
};
export default DocumentUpload;
