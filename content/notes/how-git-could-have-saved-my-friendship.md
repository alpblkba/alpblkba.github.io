+++
title = "How Git Could Have Saved My Friendship"
date = 2026-07-20

[extra]
display_date = "20-07-2026"
tag = "git"
list_title = "How Git Could Have Saved My Friendship"
+++
  <p>
  I wish I had treated one friendship more like a shared Git history. This
  note explains commits, branches, conflicts, rebasing, and recovery through
  the mistakes that made that comparison uncomfortable.
  </p>

  <p>
  Git coordinates changes in software by recording snapshots, preserving
  ancestry, exposing conflicts, and keeping recovery paths after mistakes.
  </p>

  <p>
  While learning those mechanisms, I kept finding names for failures that
  had happened outside source code too.
  </p>

  <p>
  The technical details here are real Git behaviour. The friendship is why
  I remember them, since people keep much worse version histories than
  computers do.
  </p>

  <blockquote>
  <p>
  <strong>The premise.</strong> Good version control cannot prevent change,
  disagreement, or mistakes. It keeps them visible while there is still
  enough context to understand them.
  </p>
  </blockquote>

  <nav aria-label="Table of contents">
  <strong>In this note</strong>
  <ol>
  <li><a href="#history">Git is a model of history</a></li>
  <li><a href="#working-tree">Uncommitted changes</a></li>
  <li><a href="#branches">Branches and divergence</a></li>
  <li><a href="#merge">Conflict is information</a></li>
  <li><a href="#rebase">Rebase and rewritten history</a></li>
  <li><a href="#undo">Reset, restore, and revert</a></li>
  <li><a href="#reflog">Recovery through the reflog</a></li>
  <li><a href="#remotes">Shared history and remote branches</a></li>
  <li><a href="#conclusion">What Git cannot save</a></li>
  </ol>
  </nav>

  <h2 id="history">Git is a model of history</h2>

  <p>
  Before learning commands, it helps to understand what Git stores. A
  repository is a content-addressed object database whose commits form a
  directed acyclic graph. The folder of working files is one view of that
  database.
  </p>

  <p>
  A commit points to a tree representing a project snapshot, metadata
  describing the change, and one or more parent commits. The parent links
  are what turn isolated snapshots into history.
  </p>

  <pre><code>commit
├── tree
├── parent
├── author
├── committer
└── message</code></pre>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/git-object-model.svg
  alt="Git object model showing blobs, trees, commits, tags, and their content-addressed relationships"
  loading="lazy"
  />
  <figcaption>
  Git stores content as objects connected by content-addressed
  references.
  </figcaption>
  </figure>

  <blockquote>
  <p>
  I used to argue about history as if one person owned the document. A Git
  graph keeps the shared ancestry, explicit changes, and eventual divergence
  in the same record.
  </p>
  </blockquote>

  <h2 id="working-tree">Uncommitted changes</h2>

  <p>
  A normal Git repository has three states that beginners often collapse
  into one:
  </p>

  <table>
  <tbody>
  <tr><th>Working tree</th><td>The files currently visible and editable on disk.</td></tr>
  <tr><th>Index</th><td>The exact snapshot being prepared for the next commit.</td></tr>
  <tr><th>Repository</th><td>The committed object history stored under <code>.git</code>.</td></tr>
  </tbody>
  </table>

  <pre><code>git status
git diff
git diff --staged

git add path/to/file
git commit</code></pre>

  <p>
  <code>git add</code> copies the chosen content into the index and prepares
  that exact version for the next snapshot. Tracking a file is only part of
  what the command does.
  </p>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/working-tree-index-head.svg
  alt="Git working tree, staging index, HEAD, and repository model"
  loading="lazy"
  />
  <figcaption>
  Changes move from the working tree to the index and finally into
  committed history.
  </figcaption>
  </figure>

  <blockquote>
  <p>
  My friendship did not end with one catastrophic commit. It accumulated a
  working tree full of changes that we never inspected, named, or shared.
  </p>
  </blockquote>

  <h2 id="branches">Branches are movable references</h2>

  <p>
  A Git branch is a lightweight name pointing to a commit rather than a
  separate copy of the project. As new commits are created, the active
  branch reference moves forward.
  </p>

  <pre><code>git branch
git switch -c feature/new-direction
git log --oneline --graph --decorate --all</code></pre>

  <p>
  <code>HEAD</code> normally points to the currently checked-out branch.
  In a detached HEAD state, it points directly to a commit instead.
  </p>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/head-and-branches.svg
  alt="Git HEAD and movable branch references pointing to commits"
  loading="lazy"
  />
  <figcaption>
  HEAD normally refers to the checked-out branch, while each branch is
  a movable reference to a commit.
  </figcaption>
  </figure>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/detached-head.svg
  alt="Git detached HEAD state followed by recovery through creation of a new branch"
  loading="lazy"
  />
  <figcaption>
  Work created in a detached HEAD state can be preserved by attaching
  it to a new branch.
  </figcaption>
  </figure>

  <blockquote>
  <p>
  Divergence did not make our shared history false. It meant that the same
  starting point no longer guaranteed the same destination.
  </p>
  </blockquote>

  <h2 id="merge">Conflict is information</h2>

  <p>
  A three-way merge compares two branch tips with their best common
  ancestor. When both branches changed compatible regions, Git can combine
  them automatically. When they changed the same region incompatibly, Git
  stops and asks for a human decision.
  </p>

  <pre><code>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD
our version
=======
their version
&gt;&gt;&gt;&gt;&gt;&gt;&gt; other-branch</code></pre>

  <p>
  The conflict markers represent competing changes that require
  interpretation. They only show the location where Git had to stop.
  </p>

  <pre><code>git merge other-branch
git status

# resolve the files manually

git add resolved-file
git commit</code></pre>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/three-way-merge.svg
  alt="Three-way Git merge using two branch tips and their common ancestor"
  loading="lazy"
  />
  <figcaption>
  A three-way merge compares both branch tips with their shared
  ancestor.
  </figcaption>
  </figure>

  <blockquote>
  <p>
  Git stops at a conflict because two incompatible changes need a human
  decision. Combining them automatically would hide the disagreement.
  </p>
  </blockquote>

  <h2 id="rebase">Rebase: cleaner history, different identities</h2>

  <p>
  Rebasing takes a sequence of commits, temporarily removes them, moves
  the branch to a new base, and replays equivalent changes one by one.
  </p>

  <pre><code>git switch feature
git rebase main</code></pre>

  <p>
  The replayed commits have new parents and therefore new commit hashes.
  The content may appear equivalent, but the commits are new objects.
  </p>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/merge-vs-rebase.svg
  alt="Comparison between Git merge and Git rebase commit histories"
  loading="lazy"
  />
  <figcaption>
  Merge preserves divergent ancestry. Rebase replays changes onto a new
  base to produce a linear history.
  </figcaption>
  </figure>

  <p>
  Interactive rebase provides a controlled way to edit a private sequence
  before sharing it:
  </p>

  <pre><code>git rebase -i HEAD~5

pick   a1b2c3 first coherent change
fixup  d4e5f6 typo in the previous change
reword a7b8c9 explain the decision properly
squash d0e1f2 combine related work</code></pre>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/interactive-rebase.svg
  alt="Interactive Git rebase using pick, reword, edit, squash, fixup, and drop"
  loading="lazy"
  />
  <figcaption>
  Interactive rebase turns an untidy private sequence into a deliberate
  published history.
  </figcaption>
  </figure>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/interactive-rebase.webp
  alt="Two software engineers examining and reorganizing a private commit history with interactive rebase"
  loading="lazy"
  />
  <figcaption>
  Reviewing, rewording, squashing, and dropping a private sequence
  before it becomes shared history.
  </figcaption>
  </figure>

  <blockquote>
  <p>
  Editing a private draft is reflection, while rewriting a shared past
  changes history that somebody else already depends on.
  </p>
  </blockquote>

  <h2 id="undo">Reset, restore, and revert are not synonyms</h2>

  <p>
  Git has several ways to undo work because "undo" can mean several
  different things.
  </p>

  <table>
  <tbody>
  <tr><th><code>git restore</code></th><td>Restore file content in the working tree or index.</td></tr>
  <tr><th><code>git reset</code></th><td>Move a branch reference and optionally update the index and working tree.</td></tr>
  <tr><th><code>git revert</code></th><td>Create a new commit that inverses an earlier commit.</td></tr>
  </tbody>
  </table>

  <pre><code>git reset --soft HEAD~1
git reset --mixed HEAD~1
git reset --hard HEAD~1

git restore path/to/file
git restore --staged path/to/file
git revert &lt;commit&gt;</code></pre>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/reset-soft-mixed-hard.svg
  alt="Comparison of Git reset soft, mixed, and hard modes across HEAD, the index, and the working tree"
  loading="lazy"
  />
  <figcaption>
  Soft, mixed, and hard reset differ in how they update HEAD, the index,
  and the working tree.
  </figcaption>
  </figure>

  <blockquote>
  <p>
  Some mistakes should remain visible because they explain what happened
  next without having to define the person who made them.
  </p>
  </blockquote>

  <h2 id="reflog">The reflog remembers where your references were</h2>

  <p>
  The reflog records local updates to references such as
  <code>HEAD</code>. A commit that appears lost after a reset or rebase may
  still be reachable through the reflog.
  </p>

  <pre><code>git reflog

git switch --detach &lt;old-commit&gt;
git branch recovered-work &lt;old-commit&gt;</code></pre>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/reflog-recovery.svg
  alt="Recovery of an apparently lost Git commit using reflog and a new branch"
  loading="lazy"
  />
  <figcaption>
  Reflog records previous reference positions, allowing an apparently
  lost commit to be recovered.
  </figcaption>
  </figure>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/git-recovery-cheatsheet.svg
  alt="Git recovery decision tree covering reflog, restore, reset, and related tools"
  loading="lazy"
  />
  <figcaption>
  The correct recovery tool depends on whether the missing object is a
  commit, a file, a staged change, or published history.
  </figcaption>
  </figure>

  <blockquote>
  <p>
  Recovery depends on evidence that still exists. Memory helped me, but it
  could not replace a shared record.
  </p>
  </blockquote>

  <h2 id="remotes">Shared history requires coordination</h2>

  <p>
  Remote-tracking branches such as
  <code>origin/main</code> represent the last known state of a branch in
  another repository. They are updated by fetching.
  </p>

  <pre><code>git fetch origin
git branch -vv
git log --oneline --graph --decorate --all

git pull --ff-only
git push
git push --force-with-lease</code></pre>

  <p>
  <code>--force-with-lease</code> is safer than an unconditional force
  push because it refuses to overwrite the remote branch when it has
  changed in an unexpected way.
  </p>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/local-vs-remote.svg
  alt="Local Git repository, remote-tracking reference, and remote repository with fetch, pull, and push operations"
  loading="lazy"
  />
  <figcaption>
  A local branch, a remote-tracking reference, and the branch on the
  actual remote repository are related but distinct.
  </figcaption>
  </figure>

  <blockquote>
  <p>
  I can rewrite my own draft. Before changing a shared history, I need to
  know what changed for the other person.
  </p>
  </blockquote>

  <h2 id="conclusion">What Git cannot save</h2>

  <p>
  Git preserves ancestry, identifies divergence, exposes conflicting
  changes, and recovers work that appeared lost. It can also show a team
  exactly how a system reached its current state.
  </p>

  <p>
  Git cannot decide what a person meant, make an unspoken change visible,
  or guarantee that two branches still want to merge. Those were the parts
  I needed, and they had never been committed anywhere.
  </p>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/git-mental-model.svg
  alt="Git mental model connecting snapshots, history, branches, references, recovery, and confidence"
  loading="lazy"
  />
  <figcaption>
  Git turns snapshots, ancestry, references, and recovery mechanisms
  into an understandable model of change.
  </figcaption>
  </figure>

  <blockquote>
  <p>
  Good version control cannot prevent mistakes. It keeps the sequence of
  decisions readable after they happen.
  </p>
  </blockquote>
  <figure>
  <img
  src=/assets/notes/how-git-could-have-saved-my-friendship/bib.webp
  loading="lazy"
  />
  <figcaption>
  Humans don't have <code>git status</code>, so good communication really do matters lol.  
  </figcaption>
  </figure>
