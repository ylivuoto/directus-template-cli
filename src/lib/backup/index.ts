import { api } from '../api'
import fs from 'node:fs'
import path from 'node:path'

const ROOT_DIR = path.join(__dirname, '..', '..', '..', 'backups')

async function schema(dir: string, cli: any) {
    const schemaPath = path.join(dir, 'schema')
    // Get full schema from Directus instance
    const { data }: any = await api.get('/schema/snapshot')

    fs.mkdir(schemaPath, { recursive: true }, err => {
	if (err) {
	    console.error(err);
	}
	// Dir created successfully
	cli.log('Created directory: ', schemaPath)

	const file = 'snapshot.json'
	const filePath = path.join(schemaPath, file)

	fs.writeFile(filePath, JSON.stringify(data.data, null, 4), { flag: 'w+' }, err => {
	    if (err) {
		console.error(err);
	    }
	    // file written successfully
	    cli.log(filePath)
	});
    });

    return {}
}

async function content(dir: string, cli: any) {
    const contentPath = path.join(dir, 'content')

    // Get all the collections and filter out systemcollections
    const { data }: { data: any } = await api.get('/collections')

    // Look for collections that don't start with directus_
    const collections = data.data.filter((collection: any) => {
	return !collection.collection.startsWith('directus_') && collection.schema
    })

    fs.mkdir(contentPath, { recursive: true }, async (err) => {
	if (err) {
	    console.error(err);
	}
	// Dir created successfully
	cli.log('Created directory: ', contentPath)

	for (const collection of collections) {
	    const file = `${collection.collection}.json`
	    const filePath = path.join(contentPath, file)
	    const { data }: { data: any } = await api.get(`/items/${collection.collection}`)

	    fs.writeFile(filePath, JSON.stringify(data.data, null, 4), { flag: 'w+' }, err => {
		if (err) {
		    console.error(err);
		}
		// file written successfully
		cli.log('Wrote: ', collection.collection)
	    });
	}
    });


    return {}
}

async function general(dir: string, cli: any) {
    const collections = ['operations', 'panels', 'presets', 'permissions', 'roles', 'settings', 'translations', 'users', 'flows']
    const generalPath = dir
    
    for (let collection of collections) {
	const file = `${collection}.json`
	const filePath = path.join(generalPath, file)
	const { data }: { data: any } = await api.get(`/${collection}`)

	if(collection == 'users'){
	    data.data = data.data.filter((user: any) => {
		return !user.email.startsWith('admin')
	    })
	}

	fs.writeFile(filePath, JSON.stringify(data.data, null, 4), { flag: 'w+' }, err => {
	    if (err) {
		console.error(err);
	    }
	    // file written successfully
	    cli.log('Wrote: ', collection)
	});
    }

    return {}
}

export default async function backup(dir: string, cli: any) {
    cli.log('Backup operation starts...')

    const backupPath = path.join(ROOT_DIR, dir)

    const resultSchema = await schema(backupPath, cli)
    const resultContent = await content(backupPath, cli)
    const resultGeneral = await general(backupPath, cli)


    return {}
}
