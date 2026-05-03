from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any, Mapping, MutableMapping, Optional
from urllib.parse import quote, urljoin


@dataclass(frozen=True)
class RegistryClient:
    """HTTP client for the OpenOS registry (`GET /api/agents`, install metadata)."""

    base_url: str
    token: Optional[str] = None

    def _headers(self) -> dict[str, str]:
        h: dict[str, str] = {"Accept": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h

    def _get_json(self, path: str) -> Any:
        base = self.base_url.rstrip("/") + "/"
        url = urljoin(base, path.lstrip("/"))
        req = urllib.request.Request(url, headers=self._headers(), method="GET")
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                body = resp.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            raise RuntimeError(
                f"Registry HTTP {e.code}: {e.read().decode('utf-8', errors='replace')[:500]}"
            ) from e
        except urllib.error.URLError as e:
            raise RuntimeError(f"Registry request failed: {e}") from e
        return json.loads(body)

    def list_agents(self, *, q: Optional[str] = None, tag: Optional[str] = None) -> list[MutableMapping[str, Any]]:
        """Return agent rows from ``GET /api/agents``."""
        qs: list[str] = []
        if q is not None:
            qs.append(f"q={quote(q)}")
        if tag is not None:
            qs.append(f"tag={quote(tag)}")
        suffix = ("?" + "&".join(qs)) if qs else ""
        data = self._get_json(f"api/agents{suffix}")
        if not isinstance(data, Mapping):
            raise RuntimeError("Invalid list response")
        agents = data.get("agents")
        if not isinstance(agents, list):
            raise RuntimeError("Missing agents array")
        out: list[MutableMapping[str, Any]] = []
        for a in agents:
            if isinstance(a, MutableMapping):
                out.append(a)
        return out

    def get_agent(self, slug: str, *, version: Optional[str] = None) -> Mapping[str, Any]:
        """Return one agent version payload (includes ``code`` when present)."""
        if version:
            path = f"api/agents/{quote(slug, safe='')}/versions/{quote(version, safe='')}"
        else:
            path = f"api/agents/{quote(slug, safe='')}"
        data = self._get_json(path)
        if not isinstance(data, Mapping):
            raise RuntimeError("Invalid agent response")
        return data
