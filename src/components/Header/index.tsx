import Link from 'next/link';
import Image from 'next/image';
import styles from './header.module.scss'

export default function Header() {
  return (
    <header className={styles.containerHeader}>
      <Link href="/">
        <a>
          <Image src='/Logo.svg' alt='logo' width={235} height={25} />
        </a>
      </Link>
    </header>
  )
}
