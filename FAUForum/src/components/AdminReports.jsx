import { useEffect, useState } from 'react';

const REPORT_LABELS = {
  spam: 'Spam',
  harassment: 'Harassment or bullying',
  nudity: 'Nudity or sexual content',
  hate: 'Hate speech',
  violence: 'Violence or threats',
  other: 'Other',
};

export default function AdminReports({ onBack }) {
  const [reportedPosts, setReportedPosts] = useState([]);
  const [reportedComments, setReportedComments] = useState([]);
  const [openItems, setOpenItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:3001/api/reports');

      if (!response.ok) {
        throw new Error('Could not load reports.');
      }

      const data = await response.json();

      setReportedPosts(data.reportedPosts || []);
      setReportedComments(data.reportedComments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const formatReason = (reason) => {
    if (!reason) return 'No reason listed';
    return REPORT_LABELS[reason] || reason;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Unknown date';
    return new Date(dateValue).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const toggleItem = (key) => {
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderReportDetails = (itemKey, details) => {
    const isOpen = !!openItems[itemKey];
    const reportDetails = details || [];

    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => toggleItem(itemKey)}
          className="w-full text-left rounded-xl px-3 py-2 text-sm font-bold transition-all"
          style={{
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          {isOpen ? '▾' : '▸'} View report details
          {reportDetails.length > 0 ? ` (${reportDetails.length})` : ''}
        </button>

        {isOpen && (
          <div
            className="mt-2 rounded-xl p-3 flex flex-col gap-2"
            style={{
              background: 'var(--color-surface-3)',
              border: '1px solid var(--color-border)',
            }}
          >
            {reportDetails.length > 0 ? (
              reportDetails.map((report, index) => (
                <div
                  key={`${itemKey}-${index}`}
                  className="rounded-xl px-3 py-2"
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p
                    className="text-sm font-bold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Reported by: {report.reporter_username || 'Anonymous'}
                  </p>

                  <p
                    className="text-sm mt-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Reason: {formatReason(report.reason)}
                  </p>

                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {formatDate(report.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <p
                className="text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                This report was created before individual reporter details were saved.
                New reports will show the reporter account here.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1
            className="font-display font-bold text-xl"
            style={{ color: 'var(--color-text-primary)' }}
          >
            🛡️ Admin Reports
          </h1>

          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Review posts and comments that users reported.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadReports} className="vote-btn">
            Refresh
          </button>

          <button onClick={onBack} className="vote-btn">
            Back to Feed
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading reports...
        </p>
      )}

      {error && (
        <p className="text-sm" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}

      {!loading && !error && reportedPosts.length === 0 && reportedComments.length === 0 && (
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          No reports yet. Report a post or comment from the feed and it will show up here.
        </div>
      )}

      {!loading && !error && reportedPosts.length > 0 && (
        <section className="mb-8">
          <h2
            className="font-display font-bold text-lg mb-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Reported Posts
          </h2>

          <div className="flex flex-col gap-4">
            {reportedPosts.map(post => (
              <article key={post.id} className="post-card p-5 animate-fade-in">
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div>
                    <h3
                      className="font-bold text-base"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {post.title}
                    </h3>

                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Posted by {post.username || 'Anonymous'} · {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>

                  <span
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{
                      background: 'rgba(248, 113, 113, 0.12)',
                      color: '#dc2626',
                      border: '1px solid rgba(248, 113, 113, 0.25)',
                    }}
                  >
                    {post.reports || 0} report{post.reports === 1 ? '' : 's'}
                  </span>
                </div>

                <p
                  className="text-sm leading-relaxed mb-3"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {post.content}
                </p>

                <div
                  className="text-sm rounded-xl px-3 py-2"
                  style={{
                    background: 'var(--color-surface-3)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <strong>Latest reason:</strong> {formatReason(post.report_reason)}
                </div>

                {renderReportDetails(`post-${post.id}`, post.reportDetails)}
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && !error && reportedComments.length > 0 && (
        <section>
          <h2
            className="font-display font-bold text-lg mb-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Reported Comments
          </h2>

          <div className="flex flex-col gap-4">
            {reportedComments.map(comment => (
              <article key={comment.id} className="post-card p-5 animate-fade-in">
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div>
                    <h3
                      className="font-bold text-base"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      Comment on: {comment.post_title || 'Unknown post'}
                    </h3>

                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Comment by {comment.username || 'Anonymous'} · {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>

                  <span
                    className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{
                      background: 'rgba(248, 113, 113, 0.12)',
                      color: '#dc2626',
                      border: '1px solid rgba(248, 113, 113, 0.25)',
                    }}
                  >
                    {comment.reports || 0} report{comment.reports === 1 ? '' : 's'}
                  </span>
                </div>

                <p
                  className="text-sm leading-relaxed mb-3"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {comment.content}
                </p>

                <div
                  className="text-sm rounded-xl px-3 py-2"
                  style={{
                    background: 'var(--color-surface-3)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <strong>Latest reason:</strong> {formatReason(comment.report_reason)}
                </div>

                {renderReportDetails(`comment-${comment.id}`, comment.reportDetails)}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}