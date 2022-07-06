import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import Header from '../components/Header';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { getPrismicClient } from '../services/prismic';
import { PrismicDocument } from '@prismicio/types';
import { FiCalendar, FiUser } from 'react-icons/fi'

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleMorePosts(): Promise<void> {
    const response = await fetch(nextPage);
    const jsonResponse = (await response.json());

    const newPosts = jsonResponse.results.map((post: PrismicDocument) => ({
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    setPosts([...posts, ...newPosts]);
    setNextPage(jsonResponse.next_page);
  }

  return (
    <>
      <Header />
      <main className={commonStyles.container}>
        {posts.map((post) => (
          <div className={styles.post} key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <article>
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>
                  <div>
                    <FiCalendar />
                    <time>{format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}</time>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>
                </article>
              </a>
            </Link>
          </div>
        ))}

        {nextPage !== null && <button type='button' onClick={handleMorePosts} className={styles.buttonMorePosts}>Carregar mais posts</button>}
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', { pageSize: 2 });

  const next_page = postsResponse.next_page;

  const results = postsResponse.results.map((post) => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  });

  const postsPagination = { results, next_page };

  return {
    props: {
      postsPagination
    }
  }
};
