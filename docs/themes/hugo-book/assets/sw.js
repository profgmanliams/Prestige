const cacheName = self.location.pathname
const pages = [
{{ if eq .Site.Params.BookServiceWorker "precache" }}
  {{ range .Site.AllPages -}}
  "{{ .RelPermalink }}",
  {{ end -}}
{{ end }}
];

self.addEventListener("install", function (event) {
  self.skipWaiting();
