import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const anglersDirectory = path.join(process.cwd(), 'src/app/(frontend)/anglers-corner/content')

export interface AnglerData {
  title: string
  color: string
  name: string
  image: string
  quote: string
  preview: string
  content: string
  socialMedia?: {
    instagram?: string
    facebook?: string
    youtube?: string
  }
}

export function getAllAnglers(): AnglerData[] {
  // Get file names under /content
  const fileNames = fs.readdirSync(anglersDirectory)
  const allAnglersData = fileNames.map((fileName) => {
    // Remove ".md" from file name to get id
    const id = fileName.replace(/\.md$/, '')

    // Read markdown file as string
    const fullPath = path.join(anglersDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')

    // Log the filename before parsing
    try {
      // Use gray-matter to parse the post metadata section
      const { data, content } = matter(fileContents)
      // Combine the data with the id
      return {
        ...(data as Omit<AnglerData, 'content'>),
        content,
      }
    } catch (err) {
      // Log error with filename and error message
      console.error(`Error parsing file: ${fileName}`)
      console.error(err)
      throw err
    }
  })

  return allAnglersData
}
