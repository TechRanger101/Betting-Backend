#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import readline from 'readline'
import {fileURLToPath} from 'url';

const envVarNamespace = 'aws:elasticbeanstalk:application:environment'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const requiredEnvPath = `${__dirname}/../.env.required_vars`

const readStream = fs.createReadStream(requiredEnvPath)

const lineInterface = readline.createInterface({
    input: readStream,
})

const outputMap = []

lineInterface.on('line', (line) => {
    if (
        line[0] != '#' &&
	process.env[line] !== undefined &&
	process.env[line].length > 0
    ) {
        outputMap.push({
            Namespace: envVarNamespace,
            OptionName: line,
            Value: process.env[line]
        })
    }
})

lineInterface.on('close', () => {
    console.log(JSON.stringify(outputMap))
})

