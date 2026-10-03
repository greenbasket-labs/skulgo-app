# Sync

Owns record delivery and transport.

The first implementation can use a simple local/export mechanism. Future transports may include:

- internet
- local Wi-Fi
- Bluetooth/nearby transfer
- QR/manual exchange

Business modules should call a sync interface rather than depending on a specific transport.
