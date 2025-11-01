import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import Edit from './components/Edit';
import Save from './components/Save';
import './style.scss';

registerBlockType('universal/element', {
	icon: (
		<svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M18 19.3527L16.8609 17.886H10.3108V16.3093H15.6414L14.5095 14.8427H10.3108V13.266H15.8677L14.8162 11.7993H10.3108V10.2227H13.6917L12.6402 8.756H10.3108V7.17933H13.5091L12.4795 5.71267H10.3108V4.136H11.3696L10.34 2.66933H10.3108V0L5.50588 6.72467L8.20771 6.732L2.75294 14.366H5.5643L0 22H10.3108V19.3527H18Z" fill="url(#paint0_radial_4_2)"/>
			<defs>
				<radialGradient id="paint0_radial_4_2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(9 13) rotate(90) scale(9 7.36364)">
					<stop stopColor="#54FFB9"/>
					<stop offset="1" stopColor="#03D781"/>
				</radialGradient>
			</defs>
		</svg>
	),
	edit: Edit,
	save: Save,
});
