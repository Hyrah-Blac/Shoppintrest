export interface SavedFolder {
  _id:        string
  userId:     string
  name:       string
  slug:       string
  isDefault:  boolean
  products:   string[]   // product IDs (or populated Product objects)
  coverImage?: string
  createdAt:  string
  updatedAt:  string
}