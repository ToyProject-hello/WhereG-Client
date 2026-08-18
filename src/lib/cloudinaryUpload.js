const CLOUDINARY_CLOUD_NAME = "xjhqbrgo";
const CLOUDINARY_UPLOAD_PRESET = "whereg.imgupload";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export async function uploadImageToCloudinary(file) {
  if (!file) {
    throw new Error("업로드할 이미지가 없습니다.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "이미지 업로드에 실패했습니다.");
  }

  return data.secure_url;
}
