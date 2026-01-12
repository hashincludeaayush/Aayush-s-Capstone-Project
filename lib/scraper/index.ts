"use server"

import axios from 'axios';

export async function scrapeProduct(url: string) {
  if (!url) return;

  try {
    // Replace with your actual n8n webhook URL
    const n8nEndpoint = "https://workflows.shoto.cloud/webhook/66cb6b95-4bc2-4921-a6c2-ccb62793184f";
    const response = await axios.post(n8nEndpoint, { url });

    // The n8n workflow should return the scraped product data in the same format as before
    return response.data;
  } catch (error: any) {
    console.log(error);
  }
}