import Sidebar from './Sidebar';
import RightPanel from './RightPanel';

export default function MainLayout({ children, stackCount }) {
  return (
    <div className="main-wrapper">
      <Sidebar stackCount={stackCount} />
      <main className="content-center">
        {children}
      </main>
      <RightPanel />
    </div>
  );
}
