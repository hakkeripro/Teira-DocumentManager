import type { ReactNode } from 'react';

type DocumentWorkspaceShellProps = {
  topBar: ReactNode;
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
};

export default function DocumentWorkspaceShell({
  topBar,
  leftPanel,
  centerPanel,
  rightPanel,
}: DocumentWorkspaceShellProps) {
  return (
    <div className="workspaceShell">
      <div className="workspaceTopBar">{topBar}</div>
      <div className="workspaceBody">
        <aside className="workspacePanel workspaceLeft">{leftPanel}</aside>
        <section className="workspacePanel workspaceCenter">{centerPanel}</section>
        <aside className="workspacePanel workspaceRight">{rightPanel}</aside>
      </div>
    </div>
  );
}
