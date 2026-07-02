import { getAxiosInstance } from "@/lib/services/axiosInstances";
import type { DataSourceResponse } from "@/lib/services/externalDataSourceService";

type UploadGoogleSheetParams = {
  fileId: string;
  fileName: string;
  accessToken: string;
};

export const uploadGoogleSheet = async ({
  fileId,
  fileName,
  accessToken,
}: UploadGoogleSheetParams): Promise<DataSourceResponse> => {
  const downloadRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!downloadRes.ok)
    throw new Error("Failed to download CSV file from Google Drive");

  const blob = await downloadRes.blob();
  const baseName = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  const file = new File([blob], baseName, { type: "text/csv" });

  const formData = new FormData();
  formData.append("data_source_name", fileName);
  formData.append("data_source_type", "GOOGLE_SHEETS");
  formData.append("data_source_subtype", "CSV");
  formData.append("target_source_type", "MYSQL");
  formData.append("files", file);

  const response = await getAxiosInstance().post<DataSourceResponse>(
    "/external-data/create_data_source",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return response.data;
};
