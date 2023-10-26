import { api } from '@pagerduty/pdjs'
import { isProd } from '../../config'

const token = process.env.PAGER_DUTY_API_TOKEN || ''

export const pagerDuty = api({ token })

export const fireTheAlarms = async (title = 'Server error/down', desc?: string) => {
  if (!isProd || !token) return

  const reqBody: any = {
    headers: {
      From: 'admin@frostbit.dev',
    },
    data: {
      incident: {
        type: 'incident',
        title,
        service: {
          id: 'P8S52P6',
          type: 'service_reference',
        },
      },
    },
  }

  if (desc) {
    reqBody.data.incident.body = {
      type: 'incident_body',
      details: desc,
    }
  }

  return pagerDuty.post('/incidents', reqBody)
}
