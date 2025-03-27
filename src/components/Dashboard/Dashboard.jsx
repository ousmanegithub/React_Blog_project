import React, { useState, useEffect } from 'react';
import {
  getArticles,
  createArticle,
  deleteArticle,
  updateArticle,
  getAmis,
  sendAmiRequest,
  getUsers,
  getUser,
  getComments,
  createComment,
} from '../../services/api';
import { MDBBtn, MDBInput, MDBModal, MDBModalDialog, MDBModalContent, MDBModalHeader, MDBModalBody, MDBContainer, MDBRow, MDBCol } from 'mdb-react-ui-kit';
import { CAvatar, CBadge, CButton, CCollapse, CSmartTable } from '@coreui/react-pro';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [amis, setAmis] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [statut, setStatut] = useState('public');
  const [etat, setEtat] = useState(false);
  const [details, setDetails] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [articleComments, setArticleComments] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesRes, amisRes, usersRes, userRes] = await Promise.all([
          getArticles(),
          getAmis(),
          getUsers(),
          getUser(),
        ]);
        console.log('Articles:', articlesRes.data);
        console.log('Amis:', amisRes.data);
        console.log('Users:', usersRes.data);
        console.log('Current User:', userRes.data);

        const currentUserId = userRes.data.user.id;
        const mappedUsers = usersRes.data.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          registered: user.created_at,
          status: getStatus(user.id, amisRes.data, currentUserId),
          articles: articlesRes.data.articles.filter(a => a.user_id === user.id && a.statut === 'public'),
        }));

        setArticles(articlesRes.data.articles);
        setAmis(amisRes.data);
        setUsers(mappedUsers);
        setCurrentUser(userRes.data.user);

        const userArticles = articlesRes.data.articles.filter(a => a.user_id === currentUserId);
        const commentsData = await Promise.all(userArticles.map(a => getComments(a.id)));
        const commentsMap = userArticles.reduce((acc, article, index) => {
          acc[article.id] = commentsData[index].data;
          return acc;
        }, {});
        setArticleComments(commentsMap);
      } catch (err) {
        console.error('Erreur fetch:', err);
        if (err.response?.status === 401) navigate('/login');
      }
    };
    fetchData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createArticle({ titre, contenu, statut, etat });
      setArticles([...articles, response.data.article]);
      setTitre('');
      setContenu('');
      setStatut('public');
      setEtat(false);
      setCreateModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    await deleteArticle(id);
    setArticles(articles.filter((article) => article.id !== id));
    setArticleComments(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleEdit = (article) => {
    setSelectedArticle(article);
    setTitre(article.titre);
    setContenu(article.contenu);
    setStatut(article.statut);
    setEtat(article.etat);
    setEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await updateArticle(selectedArticle.id, { titre, contenu, statut, etat });
      setArticles(articles.map(a => a.id === selectedArticle.id ? response.data.article : a));
      setEditModalOpen(false);
      setTitre('');
      setContenu('');
      setStatut('public');
      setEtat(false);
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
    }
  };

  const handleAmiRequest = async (receveur_id) => {
    try {
      console.log('Tentative d’ajout d’ami pour ID:', receveur_id);
      const response = await sendAmiRequest(receveur_id);
      console.log('Réponse de sendAmiRequest:', response.data);
      const amisRes = await getAmis();
      console.log('Nouvelle liste d’amis:', amisRes.data);
      setAmis(amisRes.data);
      setUsers(users.map(user =>
        user.id === receveur_id
          ? { ...user, status: 'Ami' }
          : user
      ));
    } catch (err) {
      console.error('Erreur lors de l’ajout d’ami:', err.response?.data || err);
      if (err.response?.status === 400 && err.response?.data.message === 'Vous etes déja des amis') {
        setUsers(users.map(user =>
          user.id === receveur_id
            ? { ...user, status: 'Ami' }
            : user
        ));
      }
    }
  };

  const toggleDetails = (id) => {
    setDetails((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const openArticleModal = async (article) => {
    setSelectedArticle(article);
    try {
      const commentsRes = await getComments(article.id);
      setComments(commentsRes.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des commentaires:', err);
      setComments([]);
    }
    setModalOpen(true);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedArticle) return;
    try {
      const response = await createComment({
        article_id: selectedArticle.id,
        contenu: newComment,
      });
      setComments([...comments, response.data]);
      setArticleComments(prev => ({
        ...prev,
        [selectedArticle.id]: [...(prev[selectedArticle.id] || []), response.data],
      }));
      setNewComment('');
    } catch (err) {
      console.error('Erreur lors de l’ajout du commentaire:', err);
    }
  };

  const getStatus = (userId, amisList, currentUserId) => {
    if (!currentUserId) return 'Ajouter';
    if (userId === currentUserId) return 'Moi';
    return amisList.some(
      (ami) =>
        (ami.demandeur_id === currentUserId && ami.receveur_id === userId) ||
        (ami.receveur_id === currentUserId && ami.demandeur_id === userId)
    ) ? 'Ami' : 'Ajouter';
  };

  const userColumns = [
    { key: 'avatar', label: '', filter: false, sorter: false },
    { key: 'name', _style: { width: '20%' } },
    { key: 'email', _style: { width: '30%' } },
    { key: 'registered', _style: { width: '20%' } },
    { key: 'status', _style: { width: '20%' } },
    { key: 'show_details', label: '', filter: false, sorter: false, _style: { width: '10%' } },
  ];

  const articleColumns = [
    { key: 'numero', label: 'Numéro', _style: { width: '20%' } },
    { key: 'comments', label: 'Commentaires', _style: { width: '50%' } },
    { key: 'actions', label: 'Actions', _style: { width: '30%' }, filter: false, sorter: false },
  ];

  const myArticles = articles
    .filter(a => a.user_id === currentUser?.id)
    .map((article, index) => ({
      id: article.id,
      numero: `Article ${index + 1}`,
      comments: articleComments[article.id]?.length > 0
        ? articleComments[article.id].map(c => c.contenu).join(', ')
        : 'Aucun commentaire',
      article: article,
    }));

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <MDBBtn
            className="gradient-custom-2 text-white px-4 py-2"
            onClick={() => setCreateModalOpen(true)}
          >
            Publier un article
          </MDBBtn>
        </div>

        <div className="w-full max-w-4xl mx-auto my-8 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CSmartTable
            columns={userColumns}
            items={users}
            columnFilter
            tableFilter
            itemsPerPage={5}
            pagination
            scopedColumns={{
              avatar: (item) => (
                <td>
                  <CAvatar src={`https://ui-avatars.com/api/?name=${item.name}`} />
                </td>
              ),
              registered: (item) => (
                <td>{new Date(item.registered).toLocaleDateString('fr-FR')}</td>
              ),
              status: (item) => (
                <td>
                  {item.status === 'Ajouter' ? (
                    <CButton color="success" size="sm" onClick={() => handleAmiRequest(item.id)}>
                      Ajouter
                    </CButton>
                  ) : (
                    <CBadge color={item.status === 'Ami' ? 'success' : 'primary'}>{item.status}</CBadge>
                  )}
                </td>
              ),
              show_details: (item) => (
                <td>
                  <CButton
                    color="primary"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleDetails(item.id)}
                  >
                    {details.includes(item.id) ? 'Cacher' : 'Voir'}
                  </CButton>
                </td>
              ),
              details: (item) => (
                <CCollapse visible={details.includes(item.id)}>
                  <div className="p-3">
                    <h4>Articles publics de {item.name}</h4>
                    {item.articles.length > 0 ? (
                      item.articles.map((article) => (
                        <div key={article.id} className="flex justify-between mb-2">
                          <p>{article.titre}</p>
                          <CButton color="info" size="sm" onClick={() => openArticleModal(article)}>
                            Lire
                          </CButton>
                        </div>
                      ))
                    ) : (
                      <p>Aucun article public</p>
                    )}
                  </div>
                </CCollapse>
              ),
            }}
            tableProps={{ responsive: true, striped: true, hover: true }}
          />
        </div>

        {/* Popup pour lire un article avec commentaires */}
        <MDBModal open={modalOpen} setOpen={setModalOpen} animationDirection="bottom">
          <MDBModalDialog size="xl" className="h-[80vh] max-h-[80vh] mx-auto">
            <MDBModalContent className="rounded-lg shadow-lg bg-white">
              <MDBModalHeader className="border-b border-gray-200 py-2 px-4 flex justify-between items-center">
                <h5 className="text-lg font-semibold text-gray-800">{selectedArticle?.titre}</h5>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </MDBModalHeader>
              <MDBModalBody className="overflow-y-auto">
                <MDBContainer className="my-5 gradient-form">
                  <MDBRow>
                    <MDBCol col="6" className="mb-5">
                      <div className="d-flex flex-column ms-5">
                        <div className="text-center">
                          <img
                            src="/assets/images/logo.png"
                            style={{ width: '185px' }}
                            alt="logo"
                          />
                          <h4 className="mt-1 mb-5 pb-1">MonBlog</h4>
                        </div>
                        <h5 className="text-lg font-semibold mb-4">{selectedArticle?.titre}</h5>
                        <p className="text-gray-700 leading-relaxed mb-4">{selectedArticle?.contenu}</p>

                        <div className="mt-6">
                          <h6 className="font-semibold mb-2">Commentaires</h6>
                          {comments.length > 0 ? (
                            comments.map((comment) => (
                              <div key={comment.id} className="border-b py-2">
                                <p className="text-sm text-gray-600">{comment.contenu}</p>
                                <p className="text-xs text-gray-500">
                                  Par {users.find(u => u.id === comment.user_id)?.name || 'Utilisateur'} -{' '}
                                  {new Date(comment.created_at).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">Aucun commentaire pour l’instant.</p>
                          )}
                        </div>

                        <form onSubmit={handleCommentSubmit} className="mt-4">
                          <MDBInput
                            wrapperClass="mb-4"
                            label="Ajouter un commentaire"
                            type="textarea"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                          <div className="flex justify-between">
                            <MDBBtn
                              type="submit"
                              className="mb-4 w-100 gradient-custom-2 mr-2"
                            >
                              Commenter
                            </MDBBtn>
                            <MDBBtn
                              className="mb-4 w-100 bg-gray-500 hover:bg-gray-600 text-white"
                              onClick={() => setModalOpen(false)}
                            >
                              Fermer
                            </MDBBtn>
                          </div>
                        </form>
                      </div>
                    </MDBCol>
                    <MDBCol col="6" className="mb-5">
                      <div className="d-flex flex-column justify-content-center gradient-custom-2 h-100 mb-4">
                        <div className="text-white px-3 py-4 p-md-5 mx-md-4">
                          <h4 className="mb-4">Plus qu’un simple blog</h4>
                          <p className="small mb-0">
                            Partagez vos idées et connectez-vous avec vos amis.
                          </p>
                        </div>
                      </div>
                    </MDBCol>
                  </MDBRow>
                </MDBContainer>
              </MDBModalBody>
            </MDBModalContent>
          </MDBModalDialog>
        </MDBModal>

        {/* Popup pour créer un article */}
        <MDBModal open={createModalOpen} setOpen={setCreateModalOpen} animationDirection="bottom">
          <MDBModalDialog size="xl" className="h-[80vh] max-h-[80vh] mx-auto">
            <MDBModalContent className="rounded-lg shadow-lg bg-white">
              <MDBModalHeader className="border-b border-gray-200 py-2 px-4 flex justify-between items-center">
                <h5 className="text-lg font-semibold text-gray-800">Créer un nouvel article</h5>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </MDBModalHeader>
              <MDBModalBody>
                <MDBContainer className="my-5 gradient-form">
                  <MDBRow>
                    <MDBCol col="6" className="mb-5">
                      <div className="d-flex flex-column ms-5">
                        <div className="text-center">
                          <img
                            src="/assets/images/logo.png"
                            style={{ width: '185px' }}
                            alt="logo"
                          />
                          <h4 className="mt-1 mb-5 pb-1">MonBlog</h4>
                        </div>
                        <p>Créer un nouvel article</p>
                        <MDBInput
                          wrapperClass="mb-4"
                          label="Titre"
                          value={titre}
                          onChange={(e) => setTitre(e.target.value)}
                        />
                        <MDBInput
                          wrapperClass="mb-4"
                          label="Contenu"
                          type="textarea"
                          value={contenu}
                          onChange={(e) => setContenu(e.target.value)}
                        />
                        <select
                          value={statut}
                          onChange={(e) => setStatut(e.target.value)}
                          className="mb-4 p-2 border rounded w-full"
                        >
                          <option value="public">Public</option>
                          <option value="prive">Privé</option>
                        </select>
                        <label className="mb-4 flex items-center">
                          <input
                            type="checkbox"
                            checked={etat}
                            onChange={(e) => setEtat(e.target.checked)}
                          />
                          <span className="ml-2">Bloqué</span>
                        </label>
                        <div className="flex justify-between">
                          <MDBBtn
                            className="mb-4 w-100 gradient-custom-2 mr-2"
                            onClick={handleSubmit}
                          >
                            Publier
                          </MDBBtn>
                          <MDBBtn
                            color="secondary"
                            className="mb-4 w-100 bg-gray-500 hover:bg-gray-600 text-white"
                            onClick={() => setCreateModalOpen(false)}
                          >
                            Annuler
                          </MDBBtn>
                        </div>
                      </div>
                    </MDBCol>
                    <MDBCol col="6" className="mb-5">
                      <div className="d-flex flex-column justify-content-center gradient-custom-2 h-100 mb-4">
                        <div className="text-white px-3 py-4 p-md-5 mx-md-4">
                          <h4 className="mb-4">Partagez vos idées</h4>
                          <p className="small mb-0">
                            Racontez votre histoire et connectez-vous avec vos amis.
                          </p>
                        </div>
                      </div>
                    </MDBCol>
                  </MDBRow>
                </MDBContainer>
              </MDBModalBody>
            </MDBModalContent>
          </MDBModalDialog>
        </MDBModal>

        {/* Popup pour modifier un article */}
        <MDBModal open={editModalOpen} setOpen={setEditModalOpen} animationDirection="bottom">
          <MDBModalDialog size="xl" className="h-[80vh] max-h-[80vh] mx-auto">
            <MDBModalContent className="rounded-lg shadow-lg bg-white">
              <MDBModalHeader className="border-b border-gray-200 py-2 px-4 flex justify-between items-center">
                <h5 className="text-lg font-semibold text-gray-800">Modifier l’article</h5>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </MDBModalHeader>
              <MDBModalBody>
                <MDBContainer className="my-5 gradient-form">
                  <MDBRow>
                    <MDBCol col="6" className="mb-5">
                      <div className="d-flex flex-column ms-5">
                        <div className="text-center">
                          <img
                            src="/assets/images/logo.png"
                            style={{ width: '185px' }}
                            alt="logo"
                          />
                          <h4 className="mt-1 mb-5 pb-1">MonBlog</h4>
                        </div>
                        <p>Modifier l’article</p>
                        <MDBInput
                          wrapperClass="mb-4"
                          label="Titre"
                          value={titre}
                          onChange={(e) => setTitre(e.target.value)}
                        />
                        <MDBInput
                          wrapperClass="mb-4"
                          label="Contenu"
                          type="textarea"
                          value={contenu}
                          onChange={(e) => setContenu(e.target.value)}
                        />
                        <select
                          value={statut}
                          onChange={(e) => setStatut(e.target.value)}
                          className="mb-4 p-2 border rounded w-full"
                        >
                          <option value="public">Public</option>
                          <option value="prive">Privé</option>
                        </select>
                        <label className="mb-4 flex items-center">
                          <input
                            type="checkbox"
                            checked={etat}
                            onChange={(e) => setEtat(e.target.checked)}
                          />
                          <span className="ml-2">Bloqué</span>
                        </label>
                        <div className="flex justify-between">
                          <MDBBtn
                            className="mb-4 w-100 gradient-custom-2 mr-2"
                            onClick={handleUpdate}
                          >
                            Mettre à jour
                          </MDBBtn>
                          <MDBBtn
                            color="secondary"
                            className="mb-4 w-100 bg-gray-500 hover:bg-gray-600 text-white"
                            onClick={() => setEditModalOpen(false)}
                          >
                            Annuler
                          </MDBBtn>
                        </div>
                      </div>
                    </MDBCol>
                    <MDBCol col="6" className="mb-5">
                      <div className="d-flex flex-column justify-content-center gradient-custom-2 h-100 mb-4">
                        <div className="text-white px-3 py-4 p-md-5 mx-md-4">
                          <h4 className="mb-4">Partagez vos idées</h4>
                          <p className="small mb-0">
                            Racontez votre histoire et connectez-vous avec vos amis.
                          </p>
                        </div>
                      </div>
                    </MDBCol>
                  </MDBRow>
                </MDBContainer>
              </MDBModalBody>
            </MDBModalContent>
          </MDBModalDialog>
        </MDBModal>

        {/* Tableau "Mes articles" */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Mes articles</h2>
          <CSmartTable
            columns={articleColumns}
            items={myArticles}
            tableProps={{ responsive: true, striped: true, hover: true }}
            scopedColumns={{
              comments: (item) => <td>{item.comments}</td>,
              actions: (item) => (
                <td>
                  <CButton
                    color="info"
                    size="sm"
                    className="mr-2"
                    onClick={() => openArticleModal(item.article)}
                  >
                    Lire
                  </CButton>
                  <CButton
                    color="warning"
                    size="sm"
                    className="mr-2"
                    onClick={() => handleEdit(item.article)}
                  >
                    Modifier
                  </CButton>
                  <CButton
                    color="danger"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    Supprimer
                  </CButton>
                </td>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}