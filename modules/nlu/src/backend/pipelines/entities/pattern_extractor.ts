import * as sdk from 'botpress/sdk'
import { flatMap } from 'lodash'

import { escapeRegex, extractPattern } from '../../tools/patterns-utils'

export const extractPatternEntities = (input: string, entityDefs: sdk.NLU.EntityDefinition[]): sdk.NLU.Entity[] => {
  return flatMap(entityDefs, entityDef => {
    const regex = new RegExp(escapeRegex(entityDef.pattern!))
    return extractPattern(input, regex).map(res => ({
      name: entityDef.name,
      type: entityDef.type, // pattern
      meta: {
        confidence: 1, // pattern always has 1 confidence
        provider: 'native',
        source: res.value,
        start: res.sourceIndex,
        end: res.sourceIndex + res.value.length - 1,
        raw: {}
      },
      data: {
        extras: {},
        value: res.value,
        unit: 'string',
      }
    }))
  })
}

const _extractEntitiesFromOccurence = (input: string, occurence: sdk.NLU.EntityDefOccurence): sdk.NLU.Entity[] => {
  const pattern = [
    occurence.name,
    ...occurence.synonyms
  ].map(escapeRegex).join('|')

  const regex = new RegExp(pattern, 'i')
  return extractPattern(input, regex)
    .map(extracted => ({
      name: occurence.name,
      type: 'list',
      meta: {
        confidence: 1, // extrated with synonyme as patterns
        provider: 'native',
        source: extracted.value,
        start: extracted.sourceIndex,
        end: extracted.sourceIndex + extracted.value.length - 1,
        raw: {}
      },
      data: {
        extras: {},
        value: occurence.name, // cannonical value,
        unit: 'string'
      }
    }))
}

export const extractListEntities = (input: string, entityDefs: sdk.NLU.EntityDefinition[]): sdk.NLU.Entity[] => {
  return flatMap(entityDefs, entityDef => {
    return flatMap((entityDef.occurences || []), occurence => {
      return _extractEntitiesFromOccurence(input, occurence)
    })
  })
}