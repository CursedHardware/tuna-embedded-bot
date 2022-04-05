export interface PartResult {
  octopart_url: string
  short_description: string
  mpn: string
  manufacturer: { name: string }
  best_datasheet?: { url: string }
  estimated_factory_lead_days?: number
}
