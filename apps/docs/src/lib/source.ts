import { docs } from 'collections/server'
import { loader } from 'fumadocs-core/source'

const basePath = process.env.BASE_PATH?.replace(/\/$/, '') ?? ''
const docsBaseUrl = `${basePath}/docs`.replace(/^\/{2,}/, '/')

export const source = loader({
  baseUrl: docsBaseUrl,
  source: docs.toFumadocsSource(),
})
