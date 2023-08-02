import {api} from '../api'

export default async (translations: any[]) => {
  for (const translation of translations) {
    try {
      await api.post('translations', translation)
    } catch (error) {
      console.log('Error uploading translation', error.response.data.errors)
    }
  }
}
