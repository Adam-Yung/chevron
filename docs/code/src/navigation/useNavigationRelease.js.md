# src/navigation/useNavigationRelease.js

Guarantees a same-tab navigation can never freeze the start page: it is released on a bfcache restore (`pageshow` persisted), when
the tab becomes visible again, or after `LEAVING_TIMEOUT_MS` if the page never unloaded (external protocol, download, 204). Only the
transition into `leaving` arms the timer, so unrelated dispatches cannot postpone it.

Reviewed: d2506896
