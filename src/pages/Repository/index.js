import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../services/api';

import Container from '../../components/Container';

import { Loading, Owner, IssueList, StateIssues, Page } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  componentDidUpdate(_, prevState) {
    const { issues } = this.state;
    if (prevState.issues !== issues) {
      localStorage.setItem('issues', JSON.stringify(issues));
    }
  }

  handleSelectChange = async e => {
    e.preventDefault();
    const { repository } = this.state;

    const stateName = e.target.value;

    const response = await api.get(
      `/repos/${repository.full_name}/issues?state=${stateName}`,
      {
        params: {
          per_page: 5,
        },
      }
    );
    this.setState({
      state: stateName,
      issues: response.data,
    });
  };

  handlePage = async e => {
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);

    const pageTransition = e.target.value;
    const { state } = this.state;

    let { page } = this.state;

    if (pageTransition === 'next') {
      page += 1;
    } else {
      page -= 1;
    }

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state,
        page,
        per_page: 5,
      },
    });

    this.setState({
      state,
      page,
      issues: response.data,
    });
  };

  render() {
    const { repository, issues, loading, page } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name} </h1>
          <p>{repository.description} </p>
        </Owner>
        <StateIssues>
          <div>Issue State: </div>
          <select onChange={this.handleSelectChange}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
        </StateIssues>
        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />

              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>

                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name} </span>
                  ))}
                </strong>

                <p>{issue.state} </p>
              </div>
            </li>
          ))}
        </IssueList>
        <Page>
          {(page !== 1 || issues.length < 5) && (
            <button
              className="button-p"
              type="button"
              onClick={this.handlePage}
              value="last"
            >
              Previous Page
            </button>
          )}
          <h1>{page}</h1>

          {issues.length >= 5 && (
            <button
              className="button-n"
              type="button"
              onClick={this.handlePage}
              value="next"
              //  disabled={page > issues.length}
            >
              Next Page
            </button>
          )}
        </Page>
      </Container>
    );
  }
}
