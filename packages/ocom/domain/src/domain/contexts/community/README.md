# Context: Community 

## Domain Structure:
- **Community** (aggregate root)
- Member (aggregate root)
  - Profile >>Member can edit their own
  - Accounts [Account] >>Member can edit their own
  - Role (entity reference)
  - Community (entity reference)
- Role (aggregate root)
  - Permissions
  - Community (entity reference)