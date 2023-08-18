import {Command} from '@oclif/core'
import {ux} from '@oclif/core'
import validateUrl from '../lib/utils/validate-url'
//import {cwd} from 'node:process'
//import fs from 'node:fs'
//import path from 'node:path'

import {api} from '../lib/api'
import backup from '../lib/backup'

const separator = '------------------'

 async function backupFolder() {
     return await ux.prompt('Give a backup folder name');
}

async function getDirectusUrl() {
  const directusUrl = await ux.prompt('What is your Directus URL?')
  // Validate URL
  if (!validateUrl(directusUrl)) {
    ux.warn('Invalid URL')
    return getDirectusUrl()
  }

  return directusUrl
}

async function getDirectusToken(directusUrl: string) {
  const directusToken = await ux.prompt('What is your Directus Admin Token?')
  // Validate token
  try {
    await api.get('/users/me', {
      headers: {
        Authorization: `Bearer ${directusToken}`,
      },
    })
    return directusToken
  } catch {
    ux.warn('Invalid token')
    return getDirectusToken(directusUrl)
  }
}

export default class BackupCommand extends Command {
  static description = 'Apply a backup operation for existing directus API.'

  static examples = [
    '$ directus-template-cli backup',
  ]

  static flags = {}

  public async run(): Promise<void> {
   // const {flags} = await this.parse(ApplyCommand)

    const folder = await backupFolder();

    const directusUrl = await getDirectusUrl()
    api.setBaseUrl(directusUrl)

    const directusToken = await getDirectusToken(directusUrl)
    api.setAuthToken(directusToken)

    this.log(separator)

    // Check if Directus instance is empty, if not, throw error
    const {data}: {data: any} = await api.get('/collections')
    // Look for collections that don't start with directus_
    const collections = data.data.filter((collection: any) => {
      return !collection.collection.startsWith('directus_')
    })

    if (collections.length < 0) {
	ux.error('Directus instance is empty, and hence the backup operation is not necessary.')
    }

    // Run load script
    ux.action.start(`Applying backup - from ${directusUrl} to ${folder}`)
    await backup(folder, this)
    ux.action.stop()

    this.log(separator)
    this.log('Backup operation applied successfully.')
    this.exit
  }
}
