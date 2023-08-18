import {api} from '../api'
import path from 'node:path'
import fs from 'node:fs'

export default async function loadData(collections: any, dir:string) {
    //const userCollections = collections
    //	.filter(item => !item.collection.startsWith('directus_', 0))
    //	.filter(item => item.schema !== null) // Filter our any "folders"
    //await loadSkeletonRecords(userCollections, dir) // Empty Records with IDs only
    //await loadFullData(userCollections, dir) // Updates all skeleton records with their other values
    //await loadSingletons(userCollections, dir)
    await loadItems(dir)
}

const loadItems = async (dir: string) => {
    const contentPath = path.join(dir, 'content')
    fs.readdir(contentPath, (err, files) => {
	if (err)
	    console.log(err);
	else {
	    console.log("\nCurrent directory filenames:");
	    files.forEach(async (file) => {
		const filePath = path.join(contentPath, file)
		console.log(filePath);
		fs.readFile(filePath, 'utf8', async (err, content) => {
		    if (err) {
			console.error(err);
			return;
		    }
		    const name = file.split('.')[0]
		    try{
			if(content == "[]"){
			    throw new Error(`File ${file} is empty.`)
			}
			console.log(content);
			const {data} = await api.post(`items/${name}`, content)
		    } catch(error) {
			console.log("Error with: ", name, ". Message: ", error.message)
		    }
		});
	    })
	}
    })
}

// Handle mandatory fields properly
// Upload record id.
// SQL reset indexes once everything is loaded. - This is required for
// Project Settings - ?
const loadSkeletonRecords = async (userCollections: any, dir:string) => {
    for (const collection of userCollections) {
	const name = collection.collection
	const url = path.resolve(
	    dir,
	    'content',
	    `${name}.json`,
	)
	try {
	    const sourceData = (await import(url)).default

	    if (!collection.meta.singleton) {
		for (const entry of sourceData) {
		    try {
			const {data} = await api.post(`items/${name}`, {
			    id: entry.id,
			})
		    } catch (error) {
			if (
			    error.response.data.errors[0].extensions.code !==
				'RECORD_NOT_UNIQUE'
			) {
			    console.log(
				'error creating skeleton record',
				error.response.data.errors,
			    )
			}
		    }
		}
	    }
	} catch (error) {
	    console.log(error.response.data.errors)
	}
    }
}

const loadFullData = async (userCollections: any, dir:string) => {
    for (const collection of userCollections) {
	const name = collection.collection
	const url = path.resolve(
	    dir,
	    'content',
	    `${name}.json`,
	)
	try {
	    const sourceData = (await import(url)).default

	    if (!collection.meta.singleton) {
		for (const row of sourceData) {
		    delete row.user_created
		    delete row.user_updated
		    const {data} = await api.patch(`items/${name}/${row.id}`, row)
		}
	    }
	} catch (error) {
	    console.log(`Error updating ${name}`, error.response.data.errors)
	}
    }
}

const loadSingletons = async (userCollections: any, dir:string) => {
    for (const collection of userCollections) {
	if (collection.meta.singleton) {
	    const name = collection.collection
	    const url = path.resolve(
		dir,
		'content',
		`${name}.json`,
	    )
	    try {
		const sourceData = (await import(url)).default
		delete sourceData.user_created
		delete sourceData.user_updated
		const {data} = await api.patch(`items/${name}`, sourceData)
	    } catch (error) {
		console.log(
		    `Error loading singleton ${name}`,
		    error.response.data.errors,
		)
	    }
	}
    }
}
