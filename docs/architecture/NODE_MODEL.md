# SkulGo Node Model

SkulGo is a local-first network of school-owned nodes.

## Node types

### Primary Admin Node
The school's primary authoritative node. It maintains the official school state and can receive authorized changes from staff nodes.

### Trusted Admin Replica
Any additional trusted device (laptop, phone, tablet, etc.) that is authorized to replicate official school state.

### Staff Working Node
A teacher, cashier, or other staff device. It stores only the data required for that user's assigned work.

### Parent/Student Node
A restricted node that receives only records explicitly permitted for that user.

## Authority

The school, represented by its authorized admin nodes, owns official records.

A staff node does not receive the school's entire database and cannot silently delete or replace official records.

## Synchronization

Nodes exchange structured record changes, not database files.

A change is considered safely delivered only after the receiving node durably stores it and returns an acknowledgement.

Connectivity may be internet, school Wi-Fi, phone hotspot/local network, nearby/Bluetooth transport, or QR/manual transfer.

The business modules do not depend on any one transport.

## Important property

The system behaves like a synchronized application across devices:

- connected nodes can appear live;
- disconnected nodes continue working locally;
- queued changes synchronize later;
- already acknowledged records remain safe on the receiving trusted node.
