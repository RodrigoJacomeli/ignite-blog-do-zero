import { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/Header';
import Head from 'next/head'

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../../services/prismic';

import hash from 'object-hash';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <span>Carregando...</span>;
  }

  const wordsPerMinute = 200;

  const totalWords = Math.round(
    post.data.content.reduce(
      (acc, contentItem) =>
        acc +
        contentItem.heading.toString().split(' ').length +
        contentItem.body.reduce(
          (acc2, bodyItem) => acc2 + bodyItem.text.toString().split(' ').length,
          0
        ),
      0
    )
  );

  const totalMinutes = Math.ceil(totalWords / wordsPerMinute);

  return (
    <>
      <Head>
        <title>{post.data.title} | Ignews </title>
      </Head>
      <Header />
      <img src={post.data.banner.url} alt='Banner' className={styles.banner} />
      <main className={commonStyles.container}>
        <article>
          <h1 className={styles.postTitle}>{post.data.title}</h1>
          <div className={styles.postInfos}>
            <div>
              <FiCalendar />
              <time>
                {format(
                  new Date(post.first_publication_date),
                  'dd MMM yyyy',
                  {
                    locale: ptBR,
                  }
                )}
              </time>
            </div>
            <div>
              <FiUser />
              <span>{post.data.author}</span>
            </div>
            <div>
              <FiClock />
              <span>{totalMinutes} min</span>
            </div>
          </div>
          <div className={styles.postContent}>
            {post.data.content.map(contentItem => (
              <div
                key={hash({ ...contentItem, ts: new Date().getTime() })}
                className={styles.contentItem}
              >
                <h2>{contentItem.heading}</h2>
                <div
                  className={styles.postBody}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(contentItem.body),
                  }}
                />
              </div>
            ))}
          </div>
        </article>

      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts', { fetch: [], pageSize: 2 });

  return {
    paths: posts.results.map((post) => ({
      params: { slug: post.uid }
    })),
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params, preview = false, previewData = {} }) => {
  const { slug } = params

  const prismic = getPrismicClient({});
  const postReturn = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  if (postReturn) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      post: {
        uid: postReturn.uid,
        first_publication_date: postReturn.first_publication_date,
        last_publication_date: postReturn.last_publication_date,
        data: {
          author: postReturn.data.author,
          title: postReturn.data.title,
          subtitle: postReturn.data.subtitle,
          content: postReturn.data.content,
          banner: {
            url: postReturn.data.banner.url,
          },
        },
      },
    },
    revalidate: 60 * 5, // 5min
  };

};




