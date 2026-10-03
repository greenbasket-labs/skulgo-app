# Sync

Sync is a record replication engine.

It does not own attendance, results, finance, or report-card business rules.

## Responsibilities

1. watch the local outbox
2. discover an available transport
3. authorize the target node
4. send changes
5. receive and durably store changes
6. acknowledge delivery
7. retry failed changes
8. deduplicate repeated changes
9. detect ordering/conflicts
10. maintain sync state

## Transport independence

Possible transports:

- internet
- school Wi-Fi
- phone hotspot/local network
- Bluetooth/nearby
- QR/manual exchange

The same change protocol is used regardless of transport.

## Live behavior

When two authorized nodes are connected, changes can appear live.

When disconnected, changes remain in the local outbox.

When connectivity returns, queued changes are delivered automatically.

## Security boundary

Sync never grants database access. It transfers only authorized record changes.
