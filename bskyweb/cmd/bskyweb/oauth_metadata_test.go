package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestOAuthMetadata(t *testing.T) {
	// atproto requires the native redirect scheme to be the client_id hostname
	// in reverse-domain order, so every host serves its own scheme.
	for _, host := range []struct {
		origin string
		native string
	}{
		{"https://canary.witchsky.app", "app.witchsky.canary:/auth/callback"},
		{"https://witchsky.app", "app.witchsky:/auth/callback"},
		{"https://app.puppykitty.racing", "racing.puppykitty.app:/auth/callback"},
	} {
		for _, native := range []bool{false, true} {
			audience := "did:web:blacksky.app#bsky_appview"
			filename := "/oauth-client-metadata.json"
			if native {
				filename = "/oauth-client-metadata-native.json"
			}
			target := host.origin + filename + "?appview=" + url.QueryEscape(audience)
			req := httptest.NewRequest(http.MethodGet, target, nil)
			rec := httptest.NewRecorder()
			ctx := echo.New().NewContext(req, rec)
			if err := (&Server{}).oauthClientMetadata(ctx, native); err != nil {
				t.Fatal(err)
			}
			var metadata struct {
				ClientID  string   `json:"client_id"`
				Scope     string   `json:"scope"`
				Redirects []string `json:"redirect_uris"`
			}
			if err := json.Unmarshal(rec.Body.Bytes(), &metadata); err != nil {
				t.Fatal(err)
			}
			if metadata.ClientID != host.origin+filename {
				t.Fatalf("wrong client ID: %s", metadata.ClientID)
			}
			if metadata.Scope != "atproto transition:generic transition:email transition:chat.bsky identity:handle" {
				t.Fatal("incorrect advertised scopes")
			}
			redirect := host.origin + "/auth/web/callback"
			if native {
				redirect = host.native
			}
			if len(metadata.Redirects) != 1 || metadata.Redirects[0] != redirect {
				t.Fatalf("incorrect redirect: %v", metadata.Redirects)
			}
		}
	}
}

func TestOAuthMetadataRejectsInvalidAudience(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "https://witchsky.app/oauth-client-metadata.json?appview=*", nil)
	ctx := echo.New().NewContext(req, httptest.NewRecorder())
	err := (&Server{}).OAuthClientMetadata(ctx)
	if httpErr, ok := err.(*echo.HTTPError); !ok || httpErr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %v", err)
	}
}

func TestReverseDomainScheme(t *testing.T) {
	for host, want := range map[string]string{
		"app.puppykitty.racing":      "racing.puppykitty.app",
		"app.puppykitty.racing:8443": "racing.puppykitty.app",
		"witchsky.app":               "app.witchsky",
	} {
		if got, ok := reverseDomainScheme(host); !ok || got != want {
			t.Fatalf("reverseDomainScheme(%q) = %q, %v, want %q", host, got, ok, want)
		}
	}
	for _, host := range []string{"localhost:8080", "127.0.0.1", "localhost"} {
		if got, ok := reverseDomainScheme(host); ok {
			t.Fatalf("reverseDomainScheme(%q) = %q, want no scheme", host, got)
		}
	}
}

func TestOAuthMetadataLocalhostKeepsGeneratedRedirect(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "http://localhost:8080/oauth-client-metadata-native.json", nil)
	rec := httptest.NewRecorder()
	ctx := echo.New().NewContext(req, rec)
	if err := (&Server{}).OAuthClientMetadataNative(ctx); err != nil {
		t.Fatal(err)
	}
	var metadata struct {
		Redirects []string `json:"redirect_uris"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &metadata); err != nil {
		t.Fatal(err)
	}
	if len(metadata.Redirects) != 1 || metadata.Redirects[0] != "racing.puppykitty.app:/auth/callback" {
		t.Fatalf("unexpected redirect: %v", metadata.Redirects)
	}
}
