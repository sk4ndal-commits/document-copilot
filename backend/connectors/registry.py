from connectors.base import BaseConnector
from connectors.sharepoint import SharePointConnector
from connectors.confluence import ConfluenceConnector

# Maps connector_type string → connector class
REGISTRY: dict[str, type[BaseConnector]] = {
    "sharepoint": SharePointConnector,
    "confluence": ConfluenceConnector,
}


def get_connector(connector_type: str, config: dict) -> BaseConnector:
    """Instantiate a connector by type using the provided config dict."""
    cls = REGISTRY.get(connector_type)
    if cls is None:
        raise ValueError(f"Unknown connector type: {connector_type!r}. Available: {list(REGISTRY)}")
    return cls(**config)
