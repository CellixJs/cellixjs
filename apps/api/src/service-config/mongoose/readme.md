

Azure CosmosDB Usage


Concepts:

CosmosDB Database 
* Autoscale throughput = a minimum of 1000 RU/s shared across a maximum of 25 containers (minimum is 1/10th allocated max)
* Manual throughput = a minimum of 400 RU/s shared across a maximum of 25 containers (no minimum per container)

Database should be created before connecting mongoose to it, otherwise the setup will not be as desired.

Decisions:
* Database: 
  * Throughput = Autoscale (allows scaling w/out requiring manual intervention)
  * Maximum RU/s = 1000 (keeps cost down for development to an absolute minimum)


Notes:

CosmosDB Container = MongoDB Collection

