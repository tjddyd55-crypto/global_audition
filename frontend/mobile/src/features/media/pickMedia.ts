import * as ImagePicker from 'expo-image-picker'

export type PickedMedia = {
  uri: string
  mimeType?: string
  fileName?: string
  fileSize?: number
}

/**
 * 네이티브 피커만 담당한다. 지원 제출은 백엔드가 URL만 받으므로
 * 선택한 파일은 업로드하지 않고 UX 보조로만 쓴다.
 */
export async function pickLibraryVideo(): Promise<PickedMedia | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) return null
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsEditing: false,
    quality: 1,
  })
  if (result.canceled || !result.assets[0]) return null
  const asset = result.assets[0]
  return {
    uri: asset.uri,
    mimeType: asset.mimeType,
    fileName: asset.fileName ?? undefined,
    fileSize: asset.fileSize,
  }
}

export async function pickLibraryImage(): Promise<PickedMedia | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) return null
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  })
  if (result.canceled || !result.assets[0]) return null
  const asset = result.assets[0]
  return {
    uri: asset.uri,
    mimeType: asset.mimeType,
    fileName: asset.fileName ?? undefined,
    fileSize: asset.fileSize,
  }
}
