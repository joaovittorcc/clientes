---
type: community
members: 2
---

# Payment Status & Pending Amount

**Members:** 2 nodes

## Members
- [[Amount Receivable Stat (stat-pendente)]] - code - index.html
- [[Payment Status Select (f-pagamento)]] - code - index.html

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Payment_Status__Pending_Amount
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Client Form Fields & Stats]]

## Top bridge nodes
- [[Amount Receivable Stat (stat-pendente)]] - degree 2, connects to 1 community
- [[Payment Status Select (f-pagamento)]] - degree 2, connects to 1 community