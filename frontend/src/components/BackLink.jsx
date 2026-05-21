import { Link } from 'react-router-dom';

import { motion } from 'framer-motion';

import { IconArrowLeft } from './icons/Icons';



export default function BackLink({ to, children }) {

  return (

    <motion.div whileHover={{ x: -3 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>

      <Link to={to} className="link-subtle -ml-1 py-1">

        <IconArrowLeft size={16} />

        {children}

      </Link>

    </motion.div>

  );

}

