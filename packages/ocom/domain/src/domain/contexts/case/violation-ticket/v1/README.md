# Violation Ticket V1 Aggregate

## Purpose
The Violation Ticket V1 aggregate manages violation tickets within the CellixJS domain. It handles the lifecycle of violation tickets, including creation, assignment, status transitions, messaging, and financial details.

## Key Domain Concepts and Entities
- **ViolationTicketV1**: The main aggregate root representing a violation ticket
- **ActivityDetail**: Tracks status changes and updates
- **ViolationTicketV1Message**: Messages associated with the ticket
- **ViolationTicketV1FinanceDetails**: Financial information including penalties and payments
- **ViolationTicketV1RevisionRequest**: Requests for revisions to the ticket

## Supported Commands
- Create new violation ticket
- Update title, description, priority
- Assign to member
- Change status with transitions
- Add messages and activity updates
- Process payments
- Request revisions
- Delete ticket

## Emitted Events
- ViolationTicketV1CreatedEvent
- ViolationTicketV1UpdatedEvent
- ViolationTicketV1DeletedEvent

## Authorization Requirements (Visa/Passport)
Uses ViolationTicketV1Visa for authorization checks based on member roles and permissions:
- canCreateTickets
- canManageTickets
- canAssignTickets
- canWorkOnTickets
- isSystemAccount

## Known Business Rules or Invariants
- Status transitions must follow defined workflow (Draft -> Submitted -> Assigned -> Paid -> Closed)
- Only authorized members can modify tickets
- Financial details must be consistent with ticket status
- Messages and activities are immutable once added