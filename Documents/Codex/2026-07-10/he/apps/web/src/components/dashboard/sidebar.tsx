const links = ['Overview', 'Practice interviews', 'Resume analysis', 'Progress'];
export function Sidebar() { return <aside className="sidebar"><a className="brand" href="/dashboard">placement<span>mentor</span></a><nav>{links.map((link, index) => <a className={index === 0 ? 'active' : ''} href="#" key={link}>{link}</a>)}</nav><div className="sidebar-footer">Your practice space</div></aside>; }
