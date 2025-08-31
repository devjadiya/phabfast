import type { Task } from '@/lib/types';
import { fromUnixTime } from 'date-fns';

const PHABRICATOR_API_URL = process.env.PHABRICATOR_API_URL;
const PHABRICATOR_API_TOKEN = process.env.PHABRICATOR_API_TOKEN;

interface PhabricatorTask {
  id: number;
  phid: string;
  fields: {
    name: string;
    description: {
      raw: string;
    };
    authorPHID: string;
    ownerPHID: string;
    status: {
      value: string;
      name: string;
    };
    isClosed: boolean;
    dateCreated: number;
    dateModified: number;
    points: number;
    subscriberPHIDs?: string[];
    projectPHIDs?: string[];
  };
  attachments: {
    projects?: {
      projectPHIDs: string[];
      tags: { [key: string]: string };
    },
    subscribers?: {
      subscriberPHIDs: string[];
      subscriberCount: number;
    }
  }
}

interface PhabricatorResponse {
    result: {
        data: PhabricatorTask[]
    },
    error_code: string | null,
    error_info: string | null
}


export async function searchPhabricatorTasks(constraints: object = {}, attachments: object = {}): Promise<Task[]> {
  if (!PHABRICATOR_API_URL || !PHABRICATOR_API_TOKEN) {
    console.error("Phabricator API URL or Token not set in .env");
    throw new Error("Phabricator API URL or Token not set.");
  }

  try {
    const form = new URLSearchParams();
    form.append('api.token', PHABRICATOR_API_TOKEN);
    
    Object.entries(constraints).forEach(([key, value]) => {
        if(Array.isArray(value)) {
            value.forEach((v, i) => form.append(`constraints[${key}][${i}]`, v))
        } else {
             if (value) form.append(`constraints[${key}]`, value as string);
        }
    });

    Object.entries(attachments).forEach(([key, value]) => {
        form.append(`attachments[${key}]`, value.toString());
    });
    
    const response = await fetch(
      `${PHABRICATOR_API_URL}/maniphest.search`,
      {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
        // Add caching to prevent re-fetching the same data too often
        next: { revalidate: 300 } // Revalidate every 5 minutes
      }
    );
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Phabricator API Error:', errorText);
        throw new Error(`Phabricator API request failed: ${response.statusText} - ${errorText}`);
    }

    const data: PhabricatorResponse = await response.json();
    
    if (data.error_code) {
      console.error('Phabricator API Error:', data.error_info);
      throw new Error(data.error_info || 'Unknown Phabricator API Error');
    }

    const phabTasks: PhabricatorTask[] = data.result.data;

    if (!phabTasks) return [];

    return phabTasks.map((phabTask: PhabricatorTask) => ({
      id: phabTask.id,
      phid: phabTask.phid,
      title: phabTask.fields.name,
      uri: `${process.env.PHABRICATOR_API_URL?.replace('/api', '')}/T${phabTask.id}`,
      authorPHID: phabTask.fields.authorPHID,
      ownerPHID: phabTask.fields.ownerPHID,
      status: phabTask.fields.status.value,
      statusName: phabTask.fields.status.name,
      isClosed: phabTask.fields.isClosed,
      dateCreated: phabTask.fields.dateCreated,
      dateModified: phabTask.fields.dateModified,
      description: phabTask.fields.description.raw,
      subscriberPHIDs: phabTask.attachments.subscribers?.subscriberPHIDs || [],
      projectPHIDs: phabTask.attachments.projects?.projectPHIDs || [],
      points: phabTask.fields.points || 0,
      subscribers: phabTask.attachments.subscribers?.subscriberCount || 0,
      tags: Object.values(phabTask.attachments.projects?.tags || {}),
      phabricatorUrl: `${process.env.PHABRICATOR_API_URL?.replace('/api', '')}/T${phabTask.id}`,
      createdAt: fromUnixTime(phabTask.fields.dateCreated).toISOString().split('T')[0],
    }));

  } catch (error) {
    console.error('Failed to fetch tasks from Phabricator:', error);
    throw new Error("Failed to fetch tasks from Phabricator.");
  }
}
