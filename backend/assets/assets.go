package assets

import (
	"context"
	"embed"
	"github.com/sharat87/prestige/exchange"
	"log"
	"mime"
	"net/http"
	"strings"
	"text/template"
)

// The static folder contains frontend build artifacts.
//go:embed *
var assets embed.FS

var embeddedTemplates = loadTemplates()

func loadTemplates() *template.Template {
	tpl, err := template.ParseFS(assets, "embeds/*.tmpl")
	if err != nil {
		log.Fatalf("Error parsing templates: %v", err)
	}
	return tpl
}

func RenderToString(name string, data any) string {
	var rendered strings.Builder

	if err := embeddedTemplates.ExecuteTemplate(&rendered, name, data); err != nil {
		log.Fatalf("Error executing %q template %v.", name, err)
	}

	return rendered.String()
}

func GetAssetString(name string) string {
	content, err := assets.ReadFile("embeds/" + name)
	if err != nil {
		log.Fatalf("Error reading %q asset: %v", name, err)
	}
	return string(content)
}

func RenderGistReadme(data any) string {
