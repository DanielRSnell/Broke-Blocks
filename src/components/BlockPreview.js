/**
 * Block Preview Component
 * Displays dynamic preview content with loading and error states
 */

import { __ } from '@wordpress/i18n';
import { Button, Spinner } from '@wordpress/components';

/**
 * Loading Skeleton
 * Shows animated placeholder while preview is loading
 */
function LoadingSkeleton() {
	return (
		<div
			className="universal-block-preview-loading"
			style={{
				padding: '20px',
				background: '#f9f9f9',
				border: '2px dashed #ddd',
				borderRadius: '4px',
				textAlign: 'center',
			}}
		>
			<Spinner style={{ margin: '0 auto 10px' }} />
			<p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
				{__('Loading dynamic preview...', 'universal-block')}
			</p>
		</div>
	);
}

/**
 * Error Display
 * Shows error message with retry option
 */
function ErrorDisplay({ error, onRetry }) {
	return (
		<div
			className="universal-block-preview-error"
			style={{
				padding: '20px',
				background: '#fff3cd',
				border: '2px solid #ffc107',
				borderRadius: '4px',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
				<span
					style={{
						fontSize: '20px',
						lineHeight: 1,
						color: '#856404',
					}}
				>
					⚠️
				</span>
				<div style={{ flex: 1 }}>
					<p
						style={{
							margin: '0 0 10px',
							color: '#856404',
							fontWeight: '600',
						}}
					>
						{__('Preview Error', 'universal-block')}
					</p>
					<p
						style={{
							margin: '0 0 10px',
							color: '#856404',
							fontSize: '13px',
						}}
					>
						{error}
					</p>
					<Button
						variant="secondary"
						size="small"
						onClick={onRetry}
						style={{
							background: '#fff',
							borderColor: '#856404',
							color: '#856404',
						}}
					>
						{__('Retry Preview', 'universal-block')}
					</Button>
				</div>
			</div>
		</div>
	);
}

/**
 * Preview Badge with Edit Button
 * Visual indicator that block is in preview mode with exit button
 */
function PreviewBadge({ onExitPreview, onSelectBlock }) {
	return (
		<div
			className="universal-block-preview-badge"
			style={{
				position: 'absolute',
				top: '8px',
				right: '8px',
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				background: '#4CAF50',
				color: 'white',
				padding: '4px 8px',
				borderRadius: '3px',
				fontSize: '11px',
				fontWeight: '600',
				textTransform: 'uppercase',
				letterSpacing: '0.5px',
				zIndex: 10,
				boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
			}}
		>
			<span>{__('Preview Mode', 'universal-block')}</span>
			<div style={{ display: 'flex', gap: '4px' }}>
				<Button
					icon="admin-generic"
					label={__('Select Block', 'universal-block')}
					onClick={(e) => {
						e.stopPropagation();
						onSelectBlock();
					}}
					style={{
						minWidth: 'auto',
						height: '20px',
						padding: '2px',
						color: 'white',
						background: 'rgba(255, 255, 255, 0.2)',
						border: 'none',
					}}
					className="universal-block-preview-select-btn"
				/>
				<Button
					icon="edit"
					label={__('Exit Preview', 'universal-block')}
					onClick={(e) => {
						e.stopPropagation();
						onExitPreview();
					}}
					style={{
						minWidth: 'auto',
						height: '20px',
						padding: '2px',
						color: 'white',
						background: 'rgba(255, 255, 255, 0.2)',
						border: 'none',
					}}
					className="universal-block-preview-edit-btn"
				/>
			</div>
		</div>
	);
}

/**
 * BlockPreview Component
 * Main component for displaying dynamic preview content
 *
 * @param {Object}   props
 * @param {string}   props.html          Compiled HTML from server
 * @param {boolean}  props.isLoading     Loading state
 * @param {string}   props.error         Error message (if any)
 * @param {Function} props.onRetry       Retry callback
 * @param {Function} props.onExitPreview Exit preview callback
 * @param {boolean}  props.showBadge     Show preview mode badge
 */
export default function BlockPreview({
	html,
	isLoading,
	error,
	onRetry,
	onExitPreview,
	showBadge = true,
}) {
	// Show loading state
	if (isLoading) {
		return <LoadingSkeleton />;
	}

	// Show error state
	if (error) {
		return <ErrorDisplay error={error} onRetry={onRetry} />;
	}

	// No content yet (initial state)
	if (!html) {
		return (
			<div
				className="universal-block-preview-empty"
				style={{
					padding: '20px',
					background: '#f0f0f0',
					border: '2px dashed #ccc',
					borderRadius: '4px',
					textAlign: 'center',
					color: '#666',
				}}
			>
				<p style={{ margin: 0, fontSize: '14px' }}>
					{__(
						'Preview will appear here when data is loaded',
						'universal-block'
					)}
				</p>
			</div>
		);
	}

	// Render preview HTML
	return (
		<div
			className="universal-block-preview-container"
			style={{
				position: 'relative',
				padding: '16px',
				background: 'transparent',
				border: '2px dashed rgba(76, 175, 80, 0.3)',
				borderRadius: '4px',
				minHeight: '50px',
			}}
		>
			{showBadge && <PreviewBadge onExitPreview={onExitPreview} />}
			<div
				className="universal-block-preview-content"
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</div>
	);
}
