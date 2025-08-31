import axios from 'axios';
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

export async function searchPhabricatorTasks(constraints: object = {}, attachments: object = {}): Promise<Task[]> {
  if (!PHABRICATOR_API_URL || !PHABRICATOR_API_TOKEN) {
    console.error("Phabricator API URL or Token not set in .env");
    throw new Error("Phabricator API URL or Token not set.");
  }

  try {
    const response = await axios.post(
      `${PHABRICATOR_API_URL}/maniphest.search`,
      new URLSearchParams({
        'api.token': PHABRICATOR_API_TOKEN,
        ...Object.fromEntries(Object.entries(constraints).map(([k, v]) => [`constraints[${k}]`, v])),
        ...Object.fromEntries(Object.entries(attachments).map(([k, v]) => [`attachments[${k}]`, v])),
      })
    );
    
    if (response.data.error_code) {
      console.error('Phabricator API Error:', response.data.error_info);
      return [];
    }

    const phabTasks: PhabricatorTask[] = response.data.result.data;

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
