// frontend/src/components/CodeDiffViewer.jsx
// Shows how the student's code evolved across run attempts.
// Displayed on MyReport page after a session is complete.

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Code } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

/**
 * Produces a line-by-line diff between two code strings.
 * Returns array of { type: 'same'|'added'|'removed', line: string }
 */
function diffLines(oldCode, newCode) {
  const oldLines = (oldCode || '').split('\n')
  const newLines = (newCode || '').split('\n')
  const result   = []

  // Simple LCS-based diff using dp table
  const m = oldLines.length
  const n = newLines.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack through dp to build diff
  let i = m, j = n
  const backtrack = []
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      backtrack.push({ type: 'same', line: oldLines[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      backtrack.push({ type: 'added', line: newLines[j - 1] })
      j--
    } else {
      backtrack.push({ type: 'removed', line: oldLines[i - 1] })
      i--
    }
  }

  return backtrack.reverse()
}

/**
 * Props:
 *  snapshots — array of { attempt, code, stdout, stderr, exitCode, tookMs, timestamp }
 */
export default function CodeDiffViewer({ snapshots = [] }) {
  const { theme } = useTheme()
  const [selectedIdx, setSelectedIdx] = useState(snapshots.length > 0 ? snapshots.length - 1 : 0)
  const [showDiff, setShowDiff]       = useState(false)

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className={`rounded-xl border p-6 text-center
                        ${theme === 'dark' ? 'border-white/10 bg-[#1a1a1d]' : 'border-gray-200 bg-white'}`}>
        <Code size={28} className='mx-auto mb-2 text-gray-400' strokeWidth={1.5} />
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          No run history available for this session.
        </p>
      </div>
    )
  }

  const current  = snapshots[selectedIdx]
  const prev     = selectedIdx > 0 ? snapshots[selectedIdx - 1] : null
  const diffData = showDiff && prev ? diffLines(prev.code, current.code) : null

  // Count added/removed lines
  const addedCount   = diffData ? diffData.filter(d => d.type === 'added').length   : 0
  const removedCount = diffData ? diffData.filter(d => d.type === 'removed').length : 0

  const t = {
    dark: {
      bg: '#1a1a1d', border: 'border-white/10', text: '#EDEDED',
      muted: '#A1A1A3', added: '#14532d', addedText: '#4ade80',
      removed: '#450a0a', removedText: '#f87171', same: 'transparent',
      sameText: '#9ca3af', tab: 'bg-white/10', activeTab: 'bg-[#818CF8]',
    },
    light: {
      bg: '#ffffff', border: 'border-gray-200', text: '#171717',
      muted: '#737373', added: '#dcfce7', addedText: '#166534',
      removed: '#fee2e2', removedText: '#991b1b', same: 'transparent',
      sameText: '#6b7280', tab: 'bg-gray-100', activeTab: 'bg-indigo-600',
    }
  }[theme]

  return (
    <div className={`rounded-xl border overflow-hidden ${t.border}`}
         style={{ backgroundColor: t.bg }}>

      {/* ── Attempt selector tabs ── */}
      <div className={`flex items-center gap-1 px-3 py-2 border-b ${t.border} overflow-x-auto`}
           style={{ backgroundColor: theme === 'dark' ? '#111113' : '#f9fafb' }}>
        <span className={`text-xs font-medium mr-2 flex-shrink-0`} style={{ color: t.muted }}>
          Attempts:
        </span>
        {snapshots.map((s, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedIdx(idx)}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedIdx === idx
                ? `${t.activeTab} text-white`
                : `${t.tab} hover:opacity-80`
            }`}
            style={selectedIdx !== idx ? { color: t.muted } : {}}
          >
            {s.exitCode === 0
              ? <CheckCircle size={11} className='text-green-400' />
              : <XCircle size={11} className='text-red-400' />}
            Run {s.attempt}
          </button>
        ))}

        {/* diff toggle — only shown when there's a previous snapshot */}
        {prev && (
          <button
            onClick={() => setShowDiff(d => !d)}
            className={`ml-auto flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                        ${showDiff ? `${t.activeTab} text-white` : `${t.tab}`}`}
            style={!showDiff ? { color: t.muted } : {}}
          >
            {showDiff ? 'Hide diff' : 'Show diff vs prev'}
          </button>
        )}
      </div>

      {/* ── Run metadata bar ── */}
      <div className={`flex items-center gap-4 px-4 py-2 border-b ${t.border} text-xs flex-wrap`}
           style={{ color: t.muted }}>
        <span className='flex items-center gap-1'>
          <Clock size={12} />
          {current.tookMs}ms
        </span>
        <span className={current.exitCode === 0 ? 'text-green-400' : 'text-red-400'}>
          Exit {current.exitCode}
        </span>
        {current.timestamp && (
          <span>{new Date(current.timestamp).toLocaleTimeString()}</span>
        )}
        {showDiff && prev && (
          <span className='ml-auto flex items-center gap-2'>
            <span className='text-green-400'>+{addedCount} lines</span>
            <span className='text-red-400'>-{removedCount} lines</span>
          </span>
        )}
      </div>

      {/* ── Code view / diff view ── */}
      <div className='overflow-auto max-h-80'>
        {showDiff && diffData ? (
          // Diff view
          <table className='w-full font-mono text-xs border-collapse'>
            <tbody>
              {diffData.map((row, i) => (
                <tr key={i}
                    style={{
                      backgroundColor:
                        row.type === 'added'   ? t.added   :
                        row.type === 'removed' ? t.removed : t.same,
                    }}>
                  <td className='w-6 px-2 select-none text-center opacity-50 border-r'
                      style={{ borderColor: theme === 'dark' ? '#2a2a2d' : '#e5e7eb',
                               color: row.type === 'added' ? t.addedText : row.type === 'removed' ? t.removedText : t.sameText }}>
                    {row.type === 'added' ? '+' : row.type === 'removed' ? '-' : ' '}
                  </td>
                  <td className='px-3 py-0.5 whitespace-pre'
                      style={{ color: row.type === 'added' ? t.addedText : row.type === 'removed' ? t.removedText : t.sameText }}>
                    {row.line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          // Plain code view
          <pre className='px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap'
               style={{ color: t.text }}>
            {current.code}
          </pre>
        )}
      </div>

      {/* ── Output strip ── */}
      {(current.stdout || current.stderr) && (
        <div className={`border-t ${t.border} px-4 py-2`}
             style={{ backgroundColor: theme === 'dark' ? '#111113' : '#f9fafb' }}>
          <p className='text-xs font-medium mb-1' style={{ color: t.muted }}>Output</p>
          {current.stdout && (
            <pre className='text-xs text-green-400 whitespace-pre-wrap leading-relaxed'>
              {current.stdout.slice(0, 400)}{current.stdout.length > 400 ? '…' : ''}
            </pre>
          )}
          {current.stderr && (
            <pre className='text-xs text-red-400 whitespace-pre-wrap leading-relaxed'>
              {current.stderr.slice(0, 400)}{current.stderr.length > 400 ? '…' : ''}
            </pre>
          )}
        </div>
      )}

      {/* ── Prev / Next navigation ── */}
      <div className={`flex items-center justify-between border-t ${t.border} px-4 py-2`}
           style={{ backgroundColor: theme === 'dark' ? '#111113' : '#f9fafb' }}>
        <button
          disabled={selectedIdx === 0}
          onClick={() => setSelectedIdx(i => i - 1)}
          className='flex items-center gap-1 text-xs disabled:opacity-30 transition-opacity'
          style={{ color: t.muted }}
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <span className='text-xs' style={{ color: t.muted }}>
          Run {current.attempt} of {snapshots.length}
        </span>
        <button
          disabled={selectedIdx === snapshots.length - 1}
          onClick={() => setSelectedIdx(i => i + 1)}
          className='flex items-center gap-1 text-xs disabled:opacity-30 transition-opacity'
          style={{ color: t.muted }}
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
