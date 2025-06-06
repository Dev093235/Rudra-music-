# Rudra Music Downloader API with Cache & Auto Delete

- Search and download song mp3 from Rudra official API.
- Cache mp3 files locally.
- Auto delete mp3 files after 5 minutes.
- Serve mp3 as static file.

## Usage

- Run `npm install`
- Run `npm start`
- Call API: `GET /download?song=SONG_NAME`
- Response JSON will have mp3 file path and URL.

Example response:

```json
{
  "title": "Tum Hi Ho",
  "artists": "Arijit Singh",
  "album": "Aashiqui 2",
  "year": 2013,
  "image": "https://...",
  "path": "/full/path/to/cache/tum_hi_ho.mp3",
  "url": "/cache/tum_hi_ho.mp3"
}
