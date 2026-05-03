import json
import unittest.mock as mock

from openos.registry import RegistryClient


def test_list_agents_parses(monkeypatch):
    body = json.dumps({"agents": [{"slug": "x", "name": "X"}]}).encode()

    class Resp:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def read(self):
            return body

    with mock.patch("urllib.request.urlopen", return_value=Resp()):
        c = RegistryClient("http://localhost:3001")
        agents = c.list_agents()
    assert agents[0]["slug"] == "x"
