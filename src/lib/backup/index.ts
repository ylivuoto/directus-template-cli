import {api} from '../api'
import fs from 'node:fs'
import path from 'node:path'

const ROOT_DIR = path.join(__dirname, '..', '..','..', 'backups')

export default async function backup(dir: string, cli: any) {
    cli.log('Backup operation starts...')

    const backupPath = path.join(ROOT_DIR, dir)
    
    // Get all the collections and filter out systemcollections
    const {data}: {data: any} = await api.get('/collections')
    
    // Look for collections that don't start with directus_
    const collections = data.data.filter((collection: any) => {
	return !collection.collection.startsWith('directus_')
    })

    fs.mkdir(backupPath, { recursive: true }, err => {
	if (err) {
	    console.error(err);
	}
	// Dir created successfully
	cli.log(backupPath)
    });

    for (const collection of collections) {
	const file = `${collection.collection}.json`
	const filePath = path.join(backupPath, file)
	
	fs.writeFile(filePath, "[]", { flag: 'w+' }, err => {
	    if (err) {
		console.error(err);
	    }
	    // file written successfully
	    cli.log(filePath)
	});
    }
    return {}
}
