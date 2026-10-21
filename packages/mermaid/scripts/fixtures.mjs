/**
 * One diagram per type Pele supports, each exercising the parts that
 * styles/mermaid.css recolours from a `--mermaid-*` token (notes, activations,
 * loops, composite states, task states, …), so check-styles.mjs can tell when
 * a selector stops matching what Pele draws.
 */
export const fixtures = {
  flowchart: `flowchart LR
  A[Start] --> B{Decide}
  B -->|yes| C([Do it])
  B -->|no| D[(Skip)]
  subgraph Group
    C --> E((End))
  end
  click C href "inkdrop://note/abc" "Open note"`,

  sequence: `sequenceDiagram
  autonumber
  participant A as Alice
  actor B as Bob
  A->>+B: Hello
  Note right of B: thinking
  loop Every minute
    B-->>A: Hi
  end
  alt sunny
    A->>B: Walk
  else rainy
    A->>B: Stay
  end
  B-->>-A: Bye`,

  class: `classDiagram
  namespace Shapes {
    class Animal {
      +String name
      +eat() void
    }
    class Dog
  }
  Animal <|-- Dog : extends
  note for Dog "Good boy"`,

  state: `stateDiagram-v2
  [*] --> Idle
  Idle --> Busy : start
  state Busy {
    [*] --> Working
    Working --> [*]
  }
  state fork_state <<fork>>
  Busy --> fork_state
  fork_state --> A
  fork_state --> B
  state join_state <<join>>
  A --> join_state
  B --> join_state
  state check <<choice>>
  join_state --> check
  check --> Idle : retry
  check --> [*] : done
  note right of Idle : waiting`,

  er: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER {
    string id PK
    date created
    int total
  }
  CUSTOMER {
    string name
    string email
  }`,

  requirement: `requirementDiagram
  requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
  }
  element test_entity {
    type: simulation
  }
  test_entity - satisfies -> test_req`,

  gantt: `gantt
  title A Gantt Diagram
  dateFormat YYYY-MM-DD
  excludes weekends
  section Design
  Spec          :done, des1, 2026-01-05, 3d
  Review        :active, des2, after des1, 2d
  section Build
  Core          :crit, b1, after des2, 4d
  Polish        :b2, after b1, 2d
  Launch        :milestone, m1, after b2, 0d
  section Ship
  Docs          :crit, done, d1, 2026-01-05, 2d
  Linked        :c1, after d1, 2d
  click c1 href "https://example.com"`,

  pie: `pie title Pets
  "Dogs" : 386
  "Cats" : 85
  "Rats" : 15
  "Birds" : 40
  "Fish" : 22`,

  gitGraph: `gitGraph
  commit id: "init"
  branch develop
  commit id: "feat" tag: "v1.0"
  checkout main
  merge develop
  branch hotfix
  commit
  checkout main
  merge hotfix`,

  quadrantChart: `quadrantChart
  title Reach and engagement
  x-axis Low Reach --> High Reach
  y-axis Low Engagement --> High Engagement
  quadrant-1 Expand
  quadrant-2 Promote
  quadrant-3 Re-evaluate
  quadrant-4 Improve
  Campaign A: [0.3, 0.6]
  Campaign B: [0.45, 0.23]
  Campaign C: [0.57, 0.69]`,

  venn: `venn-beta
  title Skills
  set A["Design"]
  set B["Code"]
  union A,B["Product"]`,

  packet: `packet
  title TCP header
  0-15: "Source Port"
  16-31: "Destination Port"
  32-63: "Sequence Number"`,

  xychart: `xychart
  title "Sales"
  x-axis [jan, feb, mar, apr]
  y-axis "Revenue" 0 --> 100
  bar [20, 40, 60, 80]
  line [10, 30, 50, 90]`,

  radar: `radar-beta
  title Skills
  axis a["Speed"], b["Power"], c["Range"]
  curve x["Alpha"]{4, 3, 2}
  curve y["Beta"]{2, 4, 3}
  max 5`,

  wardley: `wardley-beta
  title Tea Shop
  anchor Business [0.95, 0.63]
  component Cup of Tea [0.79, 0.61]
  component Kettle [0.43, 0.35]
  component Power [0.1, 0.7] (buy)
  Business -> Cup of Tea
  Cup of Tea -> Kettle
  Kettle -> Power
  evolve Kettle 0.62
  annotations [0.72, 0.03]
  annotation 1,[0.48, 0.85] "Standardising power"`,

  cynefin: `cynefin-beta
  title Decisions
  complex
    "Probe"
  complicated
    "Analyse"
  chaotic
    "Act"
  clear
    "Categorise"
  confusion
    "Unknown"
  complex --> complicated : "Pattern emerges"`,

  eventmodeling: `eventmodeling
  tf 01 ui CartScreen
  tf 02 cmd AddItem
  tf 03 evt ItemAdded
  tf 04 rmo CartItems
  tf 05 pcr Checkout`,

  usecase: `usecase-beta
  actor User
  systemBoundary Auth
    Login[Log in]
    Reset[Reset password]
    Remember[Remember me]
  end
  note for Login "Primary"
  User --> Login
  Login ..> : include Reset
  Remember ..> : extend Login`,

  architecture: `architecture-beta
  group api(cloud)[API]
  service db(database)[Database] in api
  service server(server)[Server] in api
  junction j in api
  db:L -- R:server
  server:B --> T:j`,

  c4: `C4Context
  title System Context
  Person(customer, "Customer", "A user")
  Person_Ext(guest, "Guest", "An outsider")
  Enterprise_Boundary(b0, "Company") {
    System(app, "App", "Main system")
  }
  Rel(customer, app, "Uses")`,

  block: `block-beta
  columns 3
  a["A"] b["B"] c["C"]
  block:group1:3
    d["D"] e["E"]
  end
  a --> b`,

  agentflow: `agentflow-beta TB
  flow team["Team"]
    plan["Plan"]
    act["Act"]
    plan --> act
  end`,

  swimlane: `swimlane-beta LR
  subgraph A
    s1[Step 1]
  end
  subgraph B
    s2[Step 2]
  end
  s1 --> s2`,

  mindmap: `mindmap
  root((Root))
    A
      A1
    B`,

  timeline: `timeline
  title History
  2020 : Founded
  2021 : Launched : Grew
  2022 : Expanded`,

  journey: `journey
  title My day
  section Morning
    Wake up: 3: Me
    Coffee: 5: Me, Cat`,

  kanban: `kanban
  Todo
    [Write docs]
  Doing
    [Ship it]`,

  sankey: `sankey
  A,B,10
  A,C,5
  B,D,7`,

  treemap: `treemap-beta
  "Root"
    "A": 10
    "B"
      "B1": 5
      "B2": 3`,

  railroad: `railroad-beta
  rule = sequence(terminal("a"), nonterminal("expression"), terminal("c")) ;`,

  treeView: `treeView-beta
  "root"
    "src"
      "index.ts"
    "README.md"`,

  ishikawa: `ishikawa-beta
  Late delivery
    People
      Training
    Process
      Approval`,

  info: `info`
}
