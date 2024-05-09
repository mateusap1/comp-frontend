import React, { useState } from "react";
import { toast } from "react-toastify";

type ImageUploaderProps = {
  handleUploadMetadata: (blob: Blob) => Promise<string>;
};

export default function ImageUploader({
  handleUploadMetadata
}: ImageUploaderProps) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  const [isPreviewed, setIsPreviewed] = useState(false);
  const [imagePreview, setImagePreview] = useState(<></>);

  let imagePreviewCLass =
      "max-w-sm p-6 mb-4 bg-gray-100 border-dashed border-2 border-gray-400 rounded-lg items-center mx-auto text-center cursor-pointer";

  const handleChange = (files: FileList | null) => {
    if (!files) {
      toast.error("No files uploaded");
      return;
    }

    const file = files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = e.target?.result;
        const blob = new Blob(
          e.target ? ([e.target?.result] as BlobPart[]) : undefined
        );

        setBlob(blob);
        setFileName(file.name);
        setFileType(file.type);

        setImagePreview(
          <img
            src={img as string}
            className="max-h-48 rounded-lg mx-auto"
            alt="Image preview"
          />
        );

        imagePreviewCLass =
          "max-w-sm p-6 mb-4 bg-gray-100 rounded-lg items-center mx-auto text-center cursor-pointer";
      };

      reader.readAsDataURL(file);
      setIsPreviewed(!isPreviewed);
    } else {
      setBlob(null);
      setFileName(null);
      setFileType(null);

      setImagePreview(
        <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center text-gray-500">
          No image preview
        </div>
      );
      imagePreviewCLass =
        "max-w-sm p-6 mb-4 bg-gray-100 border-dashed border-2 border-gray-400 rounded-lg items-center mx-auto text-center cursor-pointer";

      setIsPreviewed(!isPreviewed);
    }
  };

  const handleUpload = async () => {
    if (!blob || !fileName || !fileType) {
      console.error("No image selected yet.");
      return;
    }

    const result = await handleUploadMetadata(blob);
    console.log(result)
  };

  return (
    <section className="py-5">
      <div className="max-w-sm bg-white rounded-lg shadow-md overflow-hidden items-center">
        <div className="px-4 py-4">
          <div id="image-preview" className={imagePreviewCLass}>
            <input
              id="upload"
              type="file"
              className="hidden"
              accept="image/*"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleChange(e.target.files)}
            />
            <label htmlFor="upload" className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-8 h-8 text-gray-700 mx-auto mb-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-700">
                Upload picture
              </h5>
              <p className="font-normal text-sm text-gray-400 md:px-6">
                Choose photo size should be less than{" "}
                <b className="text-gray-600">2mb</b>
              </p>
              <p className="font-normal text-sm text-gray-400 md:px-6">
                and should be in{" "}
                <b className="text-gray-600">JPG, PNG, or GIF</b> format.
              </p>
              <span id="filename" className="text-gray-500 bg-gray-200 z-50">
                {fileName}
              </span>
            </label>
            {imagePreview}
          </div>
          <div className="flex items-center justify-center">
            <div className="w-full" onClick={handleUpload}>
              <label className="w-full text-white bg-[#050708] hover:bg-[#050708]/90 focus:ring-4 focus:outline-none focus:ring-[#050708]/50 font-medium rounded-lg text-sm px-5 py-2.5 flex items-center justify-center mr-2 mb-2 cursor-pointer">
                <span className="text-center ml-2">Upload</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
